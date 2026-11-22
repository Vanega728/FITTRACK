const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { randomBytes, createHmac, timingSafeEqual } = require('node:crypto');

const SESSION_COOKIE = 'fittrack_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const modules = {
  ejercicios: {
    table: 'ejercicios',
    fields: {
      nombre: ['text', true, 120],
      categoria: ['text', true, 80],
      duracion_min: ['integer', true],
      fecha: ['date', true],
      notas: ['text', false, 500],
    },
  },
  actividades: {
    table: 'actividades',
    fields: {
      tipo: ['text', true, 80],
      duracion_min: ['integer', true],
      distancia_km: ['decimal', false],
      calorias: ['integer', true],
      realizada_en: ['datetime', true],
      intensidad: ['choice', true, ['Baja', 'Media', 'Alta']],
      notas: ['text', false, 500],
    },
  },
  rutinas: {
    table: 'rutinas',
    fields: {
      nombre: ['text', true, 120],
      descripcion: ['text', false, 500],
      frecuencia: ['text', true, 120],
      ejercicios_texto: ['text', false, 800],
      fecha: ['date', false],
      estado: ['choice', true, ['Activa', 'Borrador', 'Completada']],
    },
  },
  metas: {
    table: 'metas',
    fields: {
      nombre: ['text', true, 150],
      tipo: ['choice', true, ['Distancia', 'Calorías', 'Peso', 'Frecuencia', 'Tiempo', 'Otro']],
      objetivo: ['decimal', true],
      actual: ['decimal', true],
      unidad: ['text', true, 40],
      fecha_limite: ['date', false],
    },
  },
  nutricion: {
    table: 'comidas',
    fields: {
      comida: ['choice', true, ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack']],
      alimentos: ['text', true, 500],
      porcion: ['text', true, 120],
      calorias: ['integer', true],
      proteinas_g: ['decimal', false],
      carbohidratos_g: ['decimal', false],
      grasas_g: ['decimal', false],
      consumida_en: ['datetime', true],
    },
  },
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new HttpError(503, 'Configura SESSION_SECRET con al menos 32 caracteres en Vercel.');
  }
  return secret;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function encodeSession(session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.expiresAt > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) {
      try {
        return decodeURIComponent(value.join('='));
      } catch {
        return '';
      }
    }
  }
  return '';
}

function newSession(user = null) {
  return {
    user,
    csrf: randomBytes(32).toString('hex'),
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
  };
}

function setSessionCookie(req, res, session) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(encodeSession(session))}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_SECONDS}`,
  ];
  if (secure) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function getSession(req, res) {
  let session = decodeSession(cookieValue(req, SESSION_COOKIE));
  if (!session) {
    session = newSession();
    setSessionCookie(req, res, session);
  }
  return session;
}

function requireUser(session) {
  if (!session.user || !Number.isSafeInteger(session.user.id)) {
    throw new HttpError(401, 'Inicia sesión para continuar.');
  }
  return session.user;
}

function verifyCsrf(req, session) {
  const supplied = req.headers['x-csrf-token'];
  if (typeof supplied !== 'string' || supplied.length !== session.csrf.length
      || !timingSafeEqual(Buffer.from(supplied), Buffer.from(session.csrf))) {
    throw new HttpError(403, 'La solicitud venció. Recarga la página e inténtalo de nuevo.');
  }
}

function database() {
  const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER || DB_PASSWORD === undefined) {
    throw new HttpError(503, 'Configura DB_HOST, DB_NAME, DB_USER y DB_PASSWORD en Vercel.');
  }
  if (!global.fittrackPool) {
    global.fittrackPool = mysql.createPool({
      host: DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 2,
      maxIdle: 1,
      idleTimeout: 60000,
      enableKeepAlive: true,
      decimalNumbers: true,
      dateStrings: true,
    });
  }
  return global.fittrackPool;
}

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(value));
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new HttpError(400, 'El cuerpo de la solicitud no es JSON válido.');
    }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 1024) throw new HttpError(413, 'La solicitud es demasiado grande.');
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'El cuerpo de la solicitud no es JSON válido.');
  }
}

function requiredString(value, label, max) {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw new HttpError(400, `${label} es obligatorio y admite hasta ${max} caracteres.`);
  return result;
}

function parseRecord(config, input) {
  const data = {};
  for (const [name, [type, required, limitOrChoices]] of Object.entries(config.fields)) {
    let value = input[name];
    if (value === undefined || value === null) value = '';
    if (typeof value === 'string') value = value.trim();
    if (required && value === '') throw new HttpError(400, 'Completa los campos obligatorios.');
    if (value === '' && !required) {
      data[name] = type === 'integer' || type === 'decimal' ? 0 : null;
      continue;
    }
    if (type === 'text') {
      const max = limitOrChoices;
      if (typeof value !== 'string' || value.length > max) throw new HttpError(400, `Revisa el campo ${name}.`);
      data[name] = value || null;
    } else if (type === 'integer' || type === 'decimal') {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || (type === 'integer' && !Number.isInteger(number))) {
        throw new HttpError(400, `Revisa el campo ${name}.`);
      }
      data[name] = number;
    } else if (type === 'choice') {
      if (!limitOrChoices.includes(value)) throw new HttpError(400, `El valor de ${name} no es válido.`);
      data[name] = value;
    } else if (type === 'date') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, `La fecha de ${name} no es válida.`);
      data[name] = value;
    } else if (type === 'datetime') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new HttpError(400, `La fecha de ${name} no es válida.`);
      data[name] = value.replace('T', ' ') + ':00';
    }
  }
  return data;
}

async function query(sql, values = []) {
  const [rows] = await database().execute(sql, values);
  return rows;
}

function makeCsv(rows) {
  const values = [
    ['Fecha', 'Actividad', 'Duración (min)', 'Distancia (km)', 'Calorías', 'Intensidad'],
    ...rows.map((row) => [row.realizada_en, row.tipo, row.duracion_min, row.distancia_km, row.calorias, row.intensidad]),
  ];
  const escape = (value) => {
    let text = String(value ?? '');
    if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return `\uFEFF${values.map((row) => row.map(escape).join(';')).join('\r\n')}`;
}

async function history(userId, searchParams) {
  const days = Number(searchParams.get('dias') || 30);
  const range = [0, 30, 90, 365].includes(days) ? days : 30;
  const search = (searchParams.get('q') || '').trim().slice(0, 80);
  const type = (searchParams.get('tipo') || '').trim().slice(0, 80);
  const conditions = ['usuario_id=?'];
  const values = [userId];
  if (range) conditions.push(`realizada_en >= DATE_SUB(NOW(), INTERVAL ${range} DAY)`);
  if (search) {
    conditions.push('tipo LIKE ?');
    values.push(`%${search}%`);
  }
  if (type) {
    conditions.push('tipo=?');
    values.push(type);
  }
  const rows = await query(
    `SELECT tipo,duracion_min,distancia_km,calorias,realizada_en,intensidad FROM actividades WHERE ${conditions.join(' AND ')} ORDER BY realizada_en DESC LIMIT 500`,
    values,
  );
  const [summary] = await query(
    'SELECT COUNT(*) cantidad,COALESCE(SUM(duracion_min),0) minutos,COALESCE(AVG(duracion_min),0) promedio FROM actividades WHERE usuario_id=? AND realizada_en>=DATE_SUB(NOW(),INTERVAL 56 DAY)',
    [userId],
  );
  const weeks = await query(
    'SELECT YEARWEEK(realizada_en,1) semana,MIN(DATE(realizada_en)) desde,SUM(duracion_min) minutos FROM actividades WHERE usuario_id=? AND realizada_en>=DATE_SUB(NOW(),INTERVAL 56 DAY) GROUP BY YEARWEEK(realizada_en,1) ORDER BY semana',
    [userId],
  );
  return { rows, summary, weeks, filters: { q: search, tipo: type, dias: range } };
}

async function dashboard(userId) {
  const [totals] = await query(
    'SELECT COALESCE(SUM(calorias),0) calorias,COALESCE(SUM(duracion_min),0) minutos,COALESCE(SUM(distancia_km),0) distancia FROM actividades WHERE usuario_id=? AND realizada_en>=DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)',
    [userId],
  );
  const activityDays = await query(
    'SELECT DATE(realizada_en) dia,SUM(duracion_min) minutos FROM actividades WHERE usuario_id=? AND realizada_en>=DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) GROUP BY DATE(realizada_en)',
    [userId],
  );
  const goals = await query('SELECT nombre,actual,objetivo,unidad FROM metas WHERE usuario_id=? ORDER BY creado_en DESC LIMIT 3', [userId]);
  const routines = await query('SELECT nombre,frecuencia,estado FROM rutinas WHERE usuario_id=? ORDER BY creado_en DESC LIMIT 3', [userId]);
  const activities = await query('SELECT tipo,duracion_min,distancia_km,calorias,realizada_en FROM actividades WHERE usuario_id=? ORDER BY realizada_en DESC LIMIT 3', [userId]);
  return {
    totals,
    activityDays,
    goals: goals.map((goal) => ({
      ...goal,
      progreso: goal.objetivo > 0 ? Math.min(100, Math.round(goal.actual / goal.objetivo * 100)) : 0,
    })),
    routines,
    activities,
  };
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const route = parts[0] || '';
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end();
    return;
  }
  const session = getSession(req, res);
  if (route === 'session' && req.method === 'GET') {
    json(res, 200, { user: session.user, csrfToken: session.csrf });
    return;
  }
  if (route === 'health' && req.method === 'GET') {
    json(res, 200, {
      configured: Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER
        && process.env.DB_PASSWORD !== undefined && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
    });
    return;
  }
  if (route === 'register' && req.method === 'POST') {
    if (session.user) throw new HttpError(409, 'Cierra sesión antes de crear otra cuenta.');
    verifyCsrf(req, session);
    const input = await body(req);
    const name = requiredString(input.nombre, 'El nombre', 100);
    const email = requiredString(input.correo, 'El correo', 190).toLowerCase();
    const password = String(input.contrasena || '');
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Revisa tu nombre y correo electrónico.');
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new HttpError(400, 'La contraseña debe tener entre 8 y 72 bytes.');
    const hash = await bcrypt.hash(password, 12);
    try {
      const result = await database().execute('INSERT INTO usuarios (nombre,correo,contrasena) VALUES (?,?,?)', [name, email, hash]);
      const user = { id: Number(result[0].insertId), nombre: name, correo: email };
      const next = newSession(user);
      setSessionCookie(req, res, next);
      json(res, 201, { user, csrfToken: next.csrf });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ese correo ya tiene una cuenta.');
      throw error;
    }
    return;
  }
  if (route === 'login' && req.method === 'POST') {
    if (session.user) throw new HttpError(409, 'Ya tienes una sesión iniciada. Cierra sesión antes de entrar con otra cuenta.');
    verifyCsrf(req, session);
    const input = await body(req);
    const email = String(input.correo || '').trim().toLowerCase();
    const password = String(input.contrasena || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) throw new HttpError(400, 'Ingresa un correo válido y tu contraseña.');
    const rows = await query('SELECT id,nombre,correo,contrasena FROM usuarios WHERE correo=? LIMIT 1', [email]);
    const user = rows[0];
    const storedHash = user ? String(user.contrasena).replace(/^\$2y\$/, '$2a$') : '';
    if (!user || !(await bcrypt.compare(password, storedHash))) throw new HttpError(401, 'El correo o la contraseña no son correctos.');
    const safeUser = { id: Number(user.id), nombre: user.nombre, correo: user.correo };
    const next = newSession(safeUser);
    setSessionCookie(req, res, next);
    json(res, 200, { user: safeUser, csrfToken: next.csrf });
    return;
  }
  if (route === 'logout' && req.method === 'POST') {
    verifyCsrf(req, session);
    clearSessionCookie(res);
    json(res, 200, { ok: true });
    return;
  }

  const user = requireUser(session);
  if (route === 'dashboard' && req.method === 'GET') {
    json(res, 200, await dashboard(user.id));
    return;
  }
  if (route === 'nutrition-summary' && req.method === 'GET') {
    const [summary] = await query(
      'SELECT COALESCE(SUM(calorias),0) calorias,COALESCE(SUM(proteinas_g),0) proteinas,COALESCE(SUM(carbohidratos_g),0) carbohidratos,COALESCE(SUM(grasas_g),0) grasas FROM comidas WHERE usuario_id=? AND DATE(consumida_en)=CURDATE()',
      [user.id],
    );
    const [activity] = await query(
      'SELECT COALESCE(SUM(calorias),0) quemadas FROM actividades WHERE usuario_id=? AND DATE(realizada_en)=CURDATE()',
      [user.id],
    );
    json(res, 200, { ...summary, quemadas: activity.quemadas });
    return;
  }
  if (route === 'profile') {
    if (req.method === 'GET') {
      await database().execute('INSERT IGNORE INTO perfiles (usuario_id) VALUES (?)', [user.id]);
      const rows = await query(
        'SELECT u.nombre,u.correo,p.peso_kg,p.altura_cm,p.fecha_nacimiento,p.genero,p.objetivo FROM usuarios u LEFT JOIN perfiles p ON p.usuario_id=u.id WHERE u.id=?',
        [user.id],
      );
      json(res, 200, rows[0]);
      return;
    }
    if (req.method === 'PUT') {
      verifyCsrf(req, session);
      const input = await body(req);
      const name = requiredString(input.nombre, 'El nombre', 100);
      const weight = input.peso_kg === '' || input.peso_kg == null ? null : Number(input.peso_kg);
      const height = input.altura_cm === '' || input.altura_cm == null ? null : Number(input.altura_cm);
      const gender = input.genero || 'No especificar';
      const birth = input.fecha_nacimiento || null;
      const objective = input.objetivo ? String(input.objetivo).trim().slice(0, 200) : null;
      if (name.length < 2 || (weight !== null && (!Number.isFinite(weight) || weight < 20 || weight > 400))
          || (height !== null && (!Number.isInteger(height) || height < 100 || height > 250))
          || !['Femenino', 'Masculino', 'No especificar'].includes(gender)
          || (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth))) {
        throw new HttpError(400, 'Revisa tus datos personales y sus rangos.');
      }
      const connection = await database().getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('UPDATE usuarios SET nombre=? WHERE id=?', [name, user.id]);
        await connection.execute(
          'INSERT INTO perfiles (usuario_id,peso_kg,altura_cm,fecha_nacimiento,genero,objetivo) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE peso_kg=VALUES(peso_kg),altura_cm=VALUES(altura_cm),fecha_nacimiento=VALUES(fecha_nacimiento),genero=VALUES(genero),objetivo=VALUES(objetivo)',
          [user.id, weight, height, birth, gender, objective],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      const next = { ...session, user: { ...user, nombre: name } };
      setSessionCookie(req, res, next);
      json(res, 200, { ok: true });
      return;
    }
  }
  if (route === 'exercises' && req.method === 'GET') {
    if (parts[1]) {
      const rows = await query('SELECT * FROM catalogo_ejercicios WHERE id=?', [Number(parts[1])]);
      if (!rows[0]) throw new HttpError(404, 'Ejercicio no encontrado.');
      json(res, 200, rows[0]);
      return;
    }
    const search = (url.searchParams.get('q') || '').trim().slice(0, 80);
    const category = (url.searchParams.get('categoria') || '').trim().slice(0, 80);
    const conditions = [];
    const values = [];
    if (search) {
      conditions.push('(nombre LIKE ? OR grupo_muscular LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('categoria=?');
      values.push(category);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT id,nombre,grupo_muscular,categoria,dificultad,duracion_min,calorias,descripcion,musculos FROM catalogo_ejercicios ${where} ORDER BY nombre`, values);
    const categories = await query('SELECT DISTINCT categoria FROM catalogo_ejercicios ORDER BY categoria');
    json(res, 200, { rows, categories: categories.map((item) => item.categoria) });
    return;
  }
  if (route === 'history' && req.method === 'GET') {
    const result = await history(user.id, url.searchParams);
    if (url.searchParams.has('exportar')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="fittrack-historial.csv"');
      res.setHeader('Cache-Control', 'no-store');
      res.end(makeCsv(result.rows));
      return;
    }
    json(res, 200, result);
    return;
  }
  if (route === 'records' && parts[1]) {
    const moduleName = parts[1];
    const config = modules[moduleName];
    if (!config) throw new HttpError(404, 'Sección no encontrada.');
    if (req.method === 'GET') {
      const rows = await query(`SELECT * FROM ${config.table} WHERE usuario_id=? ORDER BY creado_en DESC LIMIT 100`, [user.id]);
      json(res, 200, rows);
      return;
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      verifyCsrf(req, session);
      const input = await body(req);
      const data = parseRecord(config, input);
      if (req.method === 'POST') {
        const columns = [...Object.keys(data), 'usuario_id'];
        const marks = columns.map(() => '?').join(',');
        await database().execute(
          `INSERT INTO ${config.table} (${columns.join(',')}) VALUES (${marks})`,
          [...Object.values(data), user.id],
        );
      } else {
        const id = Number(parts[2]);
        if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'El registro no es válido.');
        const assignments = Object.keys(data).map((column) => `${column}=?`).join(',');
        const [result] = await database().execute(
          `UPDATE ${config.table} SET ${assignments} WHERE id=? AND usuario_id=?`,
          [...Object.values(data), id, user.id],
        );
        if (!result.affectedRows) throw new HttpError(404, 'No se encontró el registro.');
      }
      json(res, req.method === 'POST' ? 201 : 200, { ok: true });
      return;
    }
    if (req.method === 'DELETE') {
      verifyCsrf(req, session);
      const id = Number(parts[2]);
      if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'El registro no es válido.');
      const [result] = await database().execute(`DELETE FROM ${config.table} WHERE id=? AND usuario_id=?`, [id, user.id]);
      if (!result.affectedRows) throw new HttpError(404, 'No se encontró el registro.');
      json(res, 200, { ok: true });
      return;
    }
  }
  throw new HttpError(404, 'Ruta no encontrada.');
}

module.exports = async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.status, { error: error.message });
      return;
    }
    console.error('Error en la API de FITTRACK:', error);
    json(res, 500, { error: 'Ocurrió un error inesperado. Revisa la configuración y los registros de Vercel.' });
  }
};

module.exports.__test = { decodeSession, encodeSession, parseRecord, makeCsv, HttpError };
