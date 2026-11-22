const app = document.querySelector('#app');
const state = { user: null, csrf: '', page: 'dashboard', edit: null, draftActivity: null, notice: '', error: '' };

const modules = {
  actividades: {
    title: 'Registrar actividad',
    intro: 'Guarda un entrenamiento para ver tus estadísticas e historial.',
    fields: [
      ['tipo', 'Tipo de ejercicio', 'text', true],
      ['duracion_min', 'Duración (minutos)', 'number', true],
      ['distancia_km', 'Distancia (km)', 'number', false],
      ['calorias', 'Calorías quemadas', 'number', true],
      ['realizada_en', 'Fecha y hora', 'datetime-local', true],
      ['intensidad', 'Intensidad', 'select', true, ['Baja', 'Media', 'Alta']],
      ['notas', 'Notas (opcional)', 'text', false],
    ],
    columns: [['realizada_en', 'Fecha'], ['tipo', 'Actividad'], ['duracion_min', 'Minutos'], ['distancia_km', 'Km'], ['calorias', 'Calorías'], ['intensidad', 'Intensidad']],
  },
  ejercicios: {
    title: 'Mis ejercicios',
    intro: 'Registra y consulta tus sesiones de entrenamiento.',
    fields: [
      ['nombre', 'Nombre del ejercicio', 'text', true],
      ['categoria', 'Categoría', 'text', true],
      ['duracion_min', 'Duración (minutos)', 'number', true],
      ['fecha', 'Fecha', 'date', true],
      ['notas', 'Notas', 'text', false],
    ],
    columns: [['nombre', 'Ejercicio'], ['categoria', 'Categoría'], ['duracion_min', 'Minutos'], ['fecha', 'Fecha']],
  },
  rutinas: {
    title: 'Rutinas',
    intro: 'Organiza tus rutinas y su estado.',
    fields: [
      ['nombre', 'Nombre de la rutina', 'text', true],
      ['descripcion', 'Descripción', 'text', false],
      ['frecuencia', 'Días y hora de entrenamiento', 'text', true],
      ['ejercicios_texto', 'Ejercicios (separados por coma)', 'text', false],
      ['fecha', 'Próxima fecha', 'date', false],
      ['estado', 'Estado', 'select', true, ['Activa', 'Borrador', 'Completada']],
    ],
    columns: [['nombre', 'Rutina'], ['frecuencia', 'Días'], ['ejercicios_texto', 'Ejercicios'], ['estado', 'Estado']],
  },
  metas: {
    title: 'Metas',
    intro: 'Define tus objetivos y actualiza tu progreso.',
    fields: [
      ['nombre', 'Nombre de la meta', 'text', true],
      ['tipo', 'Tipo de meta', 'select', true, ['Distancia', 'Calorías', 'Peso', 'Frecuencia', 'Tiempo', 'Otro']],
      ['objetivo', 'Valor objetivo', 'number', true],
      ['actual', 'Progreso actual', 'number', true],
      ['unidad', 'Unidad (km, kcal, kg, sesiones…)', 'text', true],
      ['fecha_limite', 'Fecha límite', 'date', false],
    ],
    columns: [['nombre', 'Meta'], ['actual', 'Avance'], ['objetivo', 'Objetivo'], ['unidad', 'Unidad'], ['fecha_limite', 'Vence']],
  },
  nutricion: {
    title: 'Nutrición',
    intro: 'Lleva un registro sencillo de tus comidas.',
    fields: [
      ['comida', 'Tipo de comida', 'select', true, ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack']],
      ['alimentos', 'Alimento', 'text', true],
      ['porcion', 'Porción', 'text', true],
      ['calorias', 'Calorías', 'number', true],
      ['proteinas_g', 'Proteínas (g)', 'number', false],
      ['carbohidratos_g', 'Carbohidratos (g)', 'number', false],
      ['grasas_g', 'Grasas (g)', 'number', false],
      ['consumida_en', 'Fecha y hora', 'datetime-local', true],
    ],
    columns: [['comida', 'Comida'], ['alimentos', 'Alimento'], ['porcion', 'Porción'], ['calorias', 'kcal'], ['proteinas_g', 'Prot. g'], ['carbohidratos_g', 'Carb. g'], ['grasas_g', 'Grasa g'], ['consumida_en', 'Fecha']],
  },
};

const menu = [
  ['dashboard', 'Dashboard'],
  ['catalogo', 'Ejercicios'],
  ['actividades', 'Registrar actividad'],
  ['rutinas', 'Rutinas'],
  ['metas', 'Metas'],
  ['historial', 'Historial'],
  ['nutricion', 'Nutrición'],
  ['perfil', 'Perfil'],
];

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  plus: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="m3 17 6-6 4 3 8-9"/><path d="M16 5h5v5"/>',
  nutrition: '<path d="M12 21c-4.5-2.4-7-6.1-7-10a7 7 0 0 1 14 0c0 3.9-2.5 7.6-7 10Z"/><path d="M12 18V8m0 5-3-3m3 6 3-3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  fire: '<path d="M12 22c4.1 0 7-2.8 7-6.7 0-2.9-1.8-5.2-4.4-8.3-.2 2-1.2 3.2-2.7 4.1C12.2 7.3 10.8 4.8 8.5 2 8.8 6.9 5 9.2 5 15.2 5 19.2 7.8 22 12 22Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trend: '<path d="m3 17 6-6 4 3 8-9"/><path d="M16 5h5v5"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.circle}</svg>`;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (options.method && options.method !== 'GET' && state.csrf) headers['X-CSRF-Token'] = state.csrf;
  const response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...options, headers });
  if (response.status === 401) {
    state.user = null;
    state.page = 'login';
    renderAuth();
  }
  const type = response.headers.get('content-type') || '';
  const result = type.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(result?.error || 'No se pudo completar la solicitud.');
  return result;
}

function alertMarkup() {
  if (state.error) return `<div class="alert error" role="alert">${esc(state.error)}</div>`;
  if (state.notice) return `<div class="alert success" role="status">${esc(state.notice)}</div>`;
  return '';
}

function renderAuth(mode = 'login') {
  state.page = mode;
  const isRegister = mode === 'register';
  app.innerHTML = `
    <main class="auth-layout ${isRegister ? 'auth-register' : 'auth-login'}">
      <aside class="brand-panel">
        <a class="brand" href="/" aria-label="FITTRACK, inicio"><span class="brand-mark">+</span><span>FIT<span class="brand-accent">TRACK</span></span></a>
        <div class="brand-copy"><h1>${isRegister ? 'Crea tu cuenta<br><span>y empieza hoy.</span>' : 'Entrena.<br>Mide.<br><span>Mejora.</span>'}</h1>
          <p>Registra tus actividades, crea rutinas, fija metas y controla tu progreso en un solo lugar.</p></div>
      </aside>
      <section class="form-panel"><div class="form-wrap">
        <div class="mobile-brand"><a class="brand" href="/"><span class="brand-mark">+</span><span>FIT<span class="brand-accent">TRACK</span></span></a></div>
        <h2>${isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
        <p class="form-intro">${isRegister ? 'Completa tus datos para comenzar.' : 'Ingresa tus datos para continuar.'}</p>
        ${alertMarkup()}
        <form data-form="auth" data-mode="${mode}">
          ${isRegister ? `<label for="nombre">Nombre completo</label><input id="nombre" name="nombre" type="text" maxlength="100" autocomplete="name" required>` : ''}
          <label for="correo">Correo electrónico</label><input id="correo" name="correo" type="email" maxlength="190" autocomplete="email" required>
          <label for="contrasena">Contraseña</label><input id="contrasena" name="contrasena" type="password" minlength="8" maxlength="72" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required>
          ${isRegister ? `<label for="confirmacion">Confirma tu contraseña</label><input id="confirmacion" name="confirmacion" type="password" minlength="8" maxlength="72" autocomplete="new-password" required>` : ''}
          <button class="button button-orange" type="submit">${isRegister ? 'Crear cuenta' : 'Iniciar sesión'} <span aria-hidden="true">→</span></button>
        </form>
        <p class="switch-form">${isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} <a href="#" data-action="switch-auth">${isRegister ? 'Inicia sesión' : 'Regístrate gratis'}</a></p>
      </div></section>
    </main>`;
}

function renderLayout(content, title, intro) {
  app.innerHTML = `
    <div class="dashboard-body"><div class="dashboard-layout">
      <aside class="sidebar">
        <a class="dashboard-brand" href="#" data-nav="dashboard"><span class="dashboard-logo">+</span><span>FITTRACK</span></a>
        <nav class="side-nav" aria-label="Navegación principal">
          ${menu.map(([key, label]) => `<a class="side-link ${state.page === key ? 'active' : ''}" href="#" data-nav="${key}">${icon(({ dashboard: 'grid', catalogo: 'activity', actividades: 'plus', rutinas: 'circle', metas: 'target', historial: 'chart', nutricion: 'nutrition', perfil: 'user' })[key])}<span>${label}</span></a>`).join('')}
        </nav>
        <form class="logout-form" data-form="logout"><button class="logout-button" type="submit">${icon('logout')}<span>Cerrar sesión</span></button></form>
      </aside>
      <main class="dashboard-main">
        <header class="dashboard-header"><div><h1>${esc(title)}</h1><p>${esc(intro)}</p></div><span class="avatar" aria-label="Usuario ${esc(state.user.nombre)}">${esc(state.user.nombre.slice(0, 1).toLocaleUpperCase('es'))}</span></header>
        ${alertMarkup()}${content}
      </main>
    </div></div>`;
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(Number(value) || 0);
}

async function loadDashboard() {
  state.page = 'dashboard';
  const data = await api('dashboard');
  const totals = data.totals;
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = date.toLocaleDateString('en-CA');
    const found = data.activityDays.find((item) => String(item.dia).slice(0, 10) === iso);
    return { label: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index], minutes: Number(found?.minutos || 0) };
  });
  const maxMinutes = Math.max(1, ...days.map((day) => day.minutes));
  const metrics = [
    ['fire', 'orange', formatNumber(totals.calorias), 'Calorías quemadas'],
    ['clock', 'green', `${Math.floor(Number(totals.minutos) / 60)} h ${Number(totals.minutos) % 60} min`, 'Tiempo de entrenamiento'],
    ['trend', 'orange', `${formatNumber(totals.distancia, 1)} km`, 'Distancia recorrida'],
  ];
  const goalRows = data.goals.map((goal) => `<div class="goal-item"><div class="goal-title"><strong>${esc(goal.nombre)}</strong><b class="green-text">${goal.progreso} %</b></div><div class="progress-track"><span style="width:${goal.progreso}%"></span></div></div>`).join('');
  const routineRows = data.routines.map((routine) => `<div class="entry-row"><span class="entry-icon green">${esc(routine.nombre.slice(0, 1).toLocaleUpperCase('es'))}</span><span class="entry-copy"><strong>${esc(routine.nombre)}</strong><small>${esc(routine.frecuencia || routine.estado)}</small></span><span class="status-pill scheduled">${esc(routine.estado)}</span></div>`).join('');
  const activityRows = data.activities.map((activity) => `<div class="entry-row"><span class="entry-icon">${icon('activity')}</span><span class="entry-copy"><strong>${esc(activity.tipo)}</strong><small>${esc(new Date(activity.realizada_en).toLocaleDateString('es-CO'))} · ${formatNumber(activity.distancia_km, 1)} km · ${activity.duracion_min} min</small></span><b class="calories">${activity.calorias} kcal</b></div>`).join('');
  const content = `
    <section class="metrics-grid" aria-label="Resumen de actividad">${metrics.map(([symbol, color, value, label]) => `<article class="metric-card"><span class="metric-icon ${color}">${icon(symbol)}</span><div class="metric-copy"><strong>${esc(value)}</strong><span>${label}</span></div><span class="metric-change positive">Esta semana</span></article>`).join('')}</section>
    <section class="quick-grid">
      ${[['actividades', 'plus', 'Registrar actividad', 'Añade un entrenamiento', 'primary'], ['rutinas', 'circle', 'Consultar rutinas', 'Ver mis planes', ''], ['historial', 'chart', 'Revisar estadísticas', 'Tu progreso en detalle', '']].map(([page, symbol, heading, detail, extra]) => `<a class="quick-card ${extra}" href="#" data-nav="${page}"><span class="quick-icon">${icon(symbol)}</span><span class="quick-copy"><strong>${heading}</strong><small>${detail}</small></span>${icon('arrow')}</a>`).join('')}
    </section>
    <section class="middle-grid">
      <article class="panel chart-panel"><div class="panel-heading"><div><h2>Actividad semanal</h2><p>Minutos de entrenamiento por día</p></div></div>
        <div class="chart" role="img" aria-label="Actividad semanal en minutos"><div class="chart-axis"><span>${maxMinutes}</span><span>${Math.round(maxMinutes / 2)}</span><span>0</span></div><div class="chart-bars">${days.map((day) => `<div class="bar-column"><div class="bar ${day.label === ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][today.getDay() ? (today.getDay() + 5) % 7 : 6] ? 'selected' : ''}" style="--bar-height:${Math.max(4, Math.round(day.minutes / maxMinutes * 90))}%"></div><span class="bar-label">${day.label}</span></div>`).join('')}</div></div>
      </article>
      <article class="panel goals-panel"><div class="panel-heading"><h2>Metas personales</h2><a class="text-link" href="#" data-nav="metas">Ver todas</a></div><div class="goal-list">${goalRows || '<p class="form-intro">Aún no tienes metas.</p>'}</div></article>
    </section>
    <section class="bottom-grid">
      <article class="panel list-panel"><div class="panel-heading"><h2>Mis rutinas</h2><a class="text-link" href="#" data-nav="rutinas">Ver todas</a></div><div class="entry-list">${routineRows || '<p class="form-intro">Aún no tienes rutinas.</p>'}</div></article>
      <article class="panel list-panel"><div class="panel-heading"><h2>Actividad reciente</h2><a class="text-link" href="#" data-nav="historial">Ver historial</a></div><div class="entry-list">${activityRows || '<p class="form-intro">Aún no registras actividades.</p>'}</div></article>
    </section>`;
  renderLayout(content, `Hola, ${state.user.nombre}`, 'Así va tu semana. ¡Sigue así!');
}

function inputMarkup([name, label, type, required, choices], values = {}) {
  let value = values[name] ?? '';
  if (type === 'datetime-local' && value) value = String(value).replace(' ', 'T').slice(0, 16);
  if (type === 'datetime-local' && !value) {
    const now = new Date();
    value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const attr = required ? 'required' : '';
  const opts = choices?.map((choice) => `<option value="${esc(choice)}" ${value === choice ? 'selected' : ''}>${esc(choice)}</option>`).join('');
  const input = type === 'select'
    ? `<select name="${name}" ${attr}>${opts}</select>`
    : `<input name="${name}" type="${type}" value="${esc(value)}" ${attr} ${type === 'number' ? 'min="0" step="any"' : ''}>`;
  return `<label>${label}${input}</label>`;
}

function displayCell(value, name) {
  if (value === null || value === undefined || value === '') return '—';
  if (name.endsWith('_en') && /^\d{4}-\d{2}-\d{2}[ T]\d{2}/.test(String(value))) {
    return esc(new Date(String(value).replace(' ', 'T')).toLocaleString('es-CO'));
  }
  if ((name === 'fecha' || name === 'fecha_limite') && /^\d{4}-\d{2}-\d{2}/.test(String(value))) return esc(new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO'));
  return esc(value);
}

function tableMarkup(config, rows, moduleName, readOnly = false) {
  if (!rows.length) return '<p class="form-intro">Aún no hay registros. Usa el formulario para añadir el primero.</p>';
  return `<div class="table-wrap"><table><thead><tr>${config.columns.map(([, label]) => `<th>${label}</th>`).join('')}${readOnly ? '' : '<th>Acción</th>'}</tr></thead><tbody>${rows.map((row) => `<tr>${config.columns.map(([name]) => `<td>${displayCell(row[name], name)}</td>`).join('')}${readOnly ? '' : `<td><div class="row-actions"><button type="button" data-action="edit" data-module="${moduleName}" data-id="${row.id}">Editar</button><button type="button" class="delete-button" data-action="delete" data-module="${moduleName}" data-id="${row.id}">Eliminar</button></div></td>`}</tr>`).join('')}</tbody></table></div>`;
}

async function loadRecords(moduleName) {
  state.page = moduleName;
  const config = modules[moduleName];
  const [rows, history] = await Promise.all([
    api(`records/${moduleName}`),
    moduleName === 'nutricion' ? api('nutrition-summary').catch(() => null) : Promise.resolve(null),
  ]);
  const edit = state.edit?.module === moduleName ? state.edit.record : null;
  const fields = config.fields.map((field) => inputMarkup(field, edit || (state.draftActivity && moduleName === 'actividades' ? state.draftActivity : {}))).join('');
  const nutrition = history ? `<section class="nutrition-summary"><article class="panel"><h2>Macronutrientes de hoy</h2><div class="macro-grid"><b>${history.calorias} kcal</b><span>Proteínas ${formatNumber(history.proteinas, 0)} g</span><span>Carbohidratos ${formatNumber(history.carbohidratos, 0)} g</span><span>Grasas ${formatNumber(history.grasas, 0)} g</span></div></article><article class="panel"><h2>Balance calórico</h2><p>${history.calorias} / 2200 kcal consumidas</p><div class="progress-track"><span class="orange" style="width:${Math.min(100, Math.round(history.calorias / 2200 * 100))}%"></span></div><p>${history.quemadas} kcal quemadas hoy</p><strong class="green-text">Te quedan ${Math.max(0, 2200 - history.calorias)} kcal</strong></article></section>` : '';
  const content = `${nutrition}<section class="panel module-panel"><h2>${edit ? 'Editar registro' : config.title}</h2><form class="module-form" data-form="record" data-module="${moduleName}">
      <input type="hidden" name="id" value="${edit ? esc(edit.id) : ''}">${fields}
      <button class="button button-orange" type="submit">${edit ? 'Guardar cambios' : 'Guardar'}</button>${edit ? '<button class="cancel-link" type="button" data-action="cancel-edit">Cancelar</button>' : ''}
    </form></section><section class="panel module-panel"><h2>Mis ${config.title.toLocaleLowerCase('es')}</h2>${tableMarkup(config, rows, moduleName)}</section>`;
  renderLayout(content, config.title, config.intro);
}

async function loadProfile() {
  state.page = 'perfil';
  const profile = await api('profile');
  const content = `<section class="profile-grid">
    <article class="panel profile-summary"><div class="avatar profile-avatar">${esc(profile.nombre.slice(0, 1).toLocaleUpperCase('es'))}</div><h2>${esc(profile.nombre)}</h2><p>${esc(profile.correo)}</p>
      <div class="profile-stats"><span><b>${esc(profile.peso_kg ?? '—')} kg</b>Peso</span><span><b>${esc(profile.altura_cm ?? '—')} cm</b>Estatura</span></div>
      <p class="profile-goal"><small>Objetivo principal</small><b>${esc(profile.objetivo || 'Aún sin definir')}</b></p>
    </article>
    <section class="panel module-panel"><h2>Datos personales</h2><form class="module-form" data-form="profile">
      <label>Nombre completo<input name="nombre" required maxlength="100" value="${esc(profile.nombre)}"></label>
      <label>Correo electrónico<input value="${esc(profile.correo)}" disabled></label>
      <label>Fecha de nacimiento<input name="fecha_nacimiento" type="date" value="${esc(profile.fecha_nacimiento || '')}"></label>
      <label>Género<select name="genero">${['Femenino', 'Masculino', 'No especificar'].map((value) => `<option ${profile.genero === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      <label>Peso (kg)<input name="peso_kg" type="number" min="20" max="400" step="0.1" value="${esc(profile.peso_kg ?? '')}"></label>
      <label>Estatura (cm)<input name="altura_cm" type="number" min="100" max="250" value="${esc(profile.altura_cm ?? '')}"></label>
      <label>Objetivo principal<select name="objetivo">${['Mejorar resistencia', 'Ganar masa muscular', 'Perder peso', 'Mantenerme activo', 'Otro'].map((value) => `<option ${profile.objetivo === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      <button class="button button-orange" type="submit">Guardar cambios</button>
    </form></section></section>`;
  renderLayout(content, 'Mi perfil', 'Consulta y edita tus datos personales.');
}

async function loadCatalog() {
  state.page = 'catalogo';
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get('exercise');
  if (id) {
    const item = await api(`exercises/${encodeURIComponent(id)}`);
    const content = `<a class="back-link" href="#" data-nav="catalogo">← Volver al catálogo</a><h2 class="detail-title">${esc(item.nombre)}</h2>
      <div class="exercise-detail"><section class="panel exercise-hero"><span class="exercise-illustration">${esc(item.grupo_muscular)}</span><h2>Cómo hacerlo</h2><ol>${String(item.pasos).split('\n').map((step) => `<li>${esc(step)}</li>`).join('')}</ol></section>
      <section class="panel exercise-info"><h2>Información</h2><div class="exercise-stats"><span><b>${item.duracion_min} min</b>Duración</span><span><b>${item.calorias} kcal</b>Calorías aprox.</span><span><b>${esc(item.dificultad)}</b>Dificultad</span></div><p>${esc(item.descripcion)}</p><p class="muscles"><b>Músculos trabajados</b><br>${esc(item.musculos)}</p><button class="button button-orange" data-action="record-exercise" data-id="${item.id}">Registrar actividad</button></section></div>`;
    renderLayout(content, item.nombre, 'Detalle del ejercicio');
    return;
  }
  const search = params.get('q') || '';
  const category = params.get('categoria') || '';
  const query = new URLSearchParams({ q: search, categoria: category });
  const data = await api(`exercises?${query}`);
  const content = `<form class="catalog-search panel" data-form="catalog"><input name="q" placeholder="Buscar ejercicio…" value="${esc(search)}"><select name="categoria"><option value="">Todas las categorías</option>${data.categories.map((value) => `<option ${category === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><button class="button button-orange">Filtrar</button></form>
    <section class="exercise-grid">${data.rows.map((item) => `<article class="panel exercise-card"><div class="exercise-color"></div><div class="exercise-card-copy"><span class="difficulty ${esc(item.dificultad.toLocaleLowerCase('es'))}">${esc(item.dificultad)}</span><h2>${esc(item.nombre)}</h2><p>${esc(item.categoria)} · ${esc(item.grupo_muscular)}</p><a href="#" data-exercise="${item.id}">Ver detalles</a></div></article>`).join('') || '<p class="form-intro">No se encontraron ejercicios.</p>'}</section>`;
  renderLayout(content, 'Catálogo de ejercicios', 'Explora ejercicios por categoría y nivel de dificultad.');
}

async function loadHistory() {
  state.page = 'historial';
  const params = new URLSearchParams(location.hash.slice(1));
  const filters = new URLSearchParams({
    q: params.get('q') || '',
    dias: params.get('dias') || '30',
    tipo: params.get('tipo') || '',
  });
  const result = await api(`history?${filters}`);
  const maxWeek = Math.max(1, ...result.weeks.map((week) => Number(week.minutos)));
  const content = `<section class="metrics-grid history-kpis">
      <article class="metric-card"><div class="metric-copy"><strong>${result.summary.cantidad}</strong><span>Actividades en 8 semanas</span></div></article>
      <article class="metric-card"><div class="metric-copy"><strong>${result.summary.minutos} min</strong><span>Entrenamiento acumulado</span></div></article>
      <article class="metric-card"><div class="metric-copy"><strong>${Math.round(result.summary.promedio)} min</strong><span>Duración promedio</span></div></article>
    </section>
    <section class="panel history-chart"><div class="panel-heading"><div><h2>Minutos de entrenamiento por semana</h2><p>Últimas 8 semanas</p></div>
      <div class="export-actions"><a class="text-link" href="/api/history?${filters}&exportar=1">Exportar para Excel</a><button class="outline-button" type="button" onclick="window.print()">Guardar como PDF</button></div></div>
      <div class="history-bars">${result.weeks.map((week) => `<div class="history-bar-wrap"><span>${week.minutos} min</span><i style="height:${Math.max(5, Math.round(week.minutos / maxWeek * 100))}%"></i><small>${new Date(`${String(week.desde).slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}</small></div>`).join('') || '<p>Aún no hay actividades para graficar.</p>'}</div>
    </section>
    <form class="catalog-search panel" data-form="history"><input name="q" placeholder="Buscar actividad…" value="${esc(result.filters.q)}"><select name="dias">${[[30, 'Últimos 30 días'], [90, 'Últimos 90 días'], [365, 'Último año'], [0, 'Todo']].map(([value, label]) => `<option value="${value}" ${Number(result.filters.dias) === value ? 'selected' : ''}>${label}</option>`).join('')}</select><button class="button button-orange">Filtrar</button></form>
    <section class="panel module-panel"><h2>Actividades registradas</h2>${tableMarkup({ columns: [['tipo', 'Actividad'], ['duracion_min', 'Minutos'], ['distancia_km', 'Km'], ['calorias', 'Calorías'], ['realizada_en', 'Fecha']] }, result.rows, 'actividades', true)}</section>`;
  renderLayout(content, 'Historial', 'Consulta tus actividades registradas.');
}

async function loadPage() {
  try {
    if (state.page === 'dashboard') return await loadDashboard();
    if (modules[state.page]) return await loadRecords(state.page);
    if (state.page === 'perfil') return await loadProfile();
    if (state.page === 'catalogo') return await loadCatalog();
    if (state.page === 'historial') return await loadHistory();
    state.page = 'dashboard';
    return await loadDashboard();
  } catch (error) {
    state.error = error.message;
    if (!state.user) {
      renderAuth('login');
      return;
    }
    renderLayout(`<section class="panel module-panel"><p>${esc(error.message)}</p><button class="button button-orange" data-action="retry">Intentar de nuevo</button></section>`, pageTitle(state.page), 'No se pudo cargar esta pantalla.');
  }
}

function pageTitle(page) {
  return modules[page]?.title || ({ dashboard: 'Dashboard', catalogo: 'Catálogo de ejercicios', historial: 'Historial', perfil: 'Mi perfil' })[page] || 'FITTRACK';
}

async function bootstrap() {
  try {
    const session = await api('session');
    state.user = session.user;
    state.csrf = session.csrfToken;
    if (state.user) await loadPage();
    else renderAuth();
  } catch (error) {
    state.error = error.message;
    app.innerHTML = `<main class="auth-layout auth-login"><section class="form-panel"><div class="form-wrap"><h1>FITTRACK</h1><div class="alert error" role="alert">${esc(error.message)}</div><p>Configura las variables de entorno requeridas en el proyecto Vercel y vuelve a cargar la página.</p></div></section></main>`;
  }
}

app.addEventListener('click', async (event) => {
  const link = event.target.closest('[data-nav], [data-action], [data-exercise]');
  if (!link) return;
  if (link.dataset.nav) {
    event.preventDefault();
    state.page = link.dataset.nav;
    state.edit = null;
    state.draftActivity = null;
    state.error = '';
    state.notice = '';
    location.hash = '';
    await loadPage();
    return;
  }
  if (link.dataset.exercise) {
    event.preventDefault();
    state.page = 'catalogo';
    location.hash = `exercise=${encodeURIComponent(link.dataset.exercise)}`;
    await loadPage();
    return;
  }
  const action = link.dataset.action;
  if (action === 'switch-auth') {
    event.preventDefault();
    state.error = '';
    renderAuth(state.page === 'register' ? 'login' : 'register');
  } else if (action === 'retry') {
    state.error = '';
    await loadPage();
  } else if (action === 'cancel-edit') {
    state.edit = null;
    await loadRecords(state.page);
  } else if (action === 'edit') {
    try {
      const rows = await api(`records/${link.dataset.module}`);
      state.edit = { module: link.dataset.module, record: rows.find((row) => String(row.id) === link.dataset.id) };
      await loadRecords(link.dataset.module);
    } catch (error) {
      state.error = error.message;
      await loadPage();
    }
  } else if (action === 'delete') {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await api(`records/${link.dataset.module}/${link.dataset.id}`, { method: 'DELETE' });
      state.notice = 'Registro eliminado correctamente.';
      await loadRecords(link.dataset.module);
    } catch (error) {
      state.error = error.message;
      await loadRecords(link.dataset.module);
    }
  } else if (action === 'record-exercise') {
    try {
      const item = await api(`exercises/${link.dataset.id}`);
      state.draftActivity = { tipo: item.nombre, duracion_min: item.duracion_min, calorias: item.calorias, intensidad: 'Media' };
      state.page = 'actividades';
      state.edit = null;
      await loadRecords('actividades');
    } catch (error) {
      state.error = error.message;
      await loadPage();
    }
  }
});

app.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  state.error = '';
  state.notice = '';
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    if (form.dataset.form === 'auth') {
      if (form.dataset.mode === 'register' && values.contrasena !== values.confirmacion) throw new Error('Las contraseñas no coinciden.');
      const result = await api(form.dataset.mode, { method: 'POST', body: JSON.stringify(values) });
      state.user = result.user;
      state.csrf = result.csrfToken;
      state.page = 'dashboard';
      state.notice = form.dataset.mode === 'register' ? 'Cuenta creada correctamente.' : '';
      await loadDashboard();
    } else if (form.dataset.form === 'logout') {
      await api('logout', { method: 'POST', body: '{}' });
      state.user = null;
      state.page = 'login';
      state.csrf = '';
      state.notice = 'Has cerrado sesión correctamente.';
      const session = await api('session');
      state.csrf = session.csrfToken;
      renderAuth('login');
    } else if (form.dataset.form === 'record') {
      const id = values.id;
      delete values.id;
      await api(`records/${form.dataset.module}${id ? `/${encodeURIComponent(id)}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(values),
      });
      state.edit = null;
      state.draftActivity = null;
      state.notice = 'Cambios guardados correctamente.';
      await loadRecords(form.dataset.module);
    } else if (form.dataset.form === 'profile') {
      await api('profile', { method: 'PUT', body: JSON.stringify(values) });
      state.user.nombre = values.nombre.trim();
      state.notice = 'Perfil actualizado correctamente.';
      await loadProfile();
    } else if (form.dataset.form === 'catalog') {
      const params = new URLSearchParams({ q: values.q, categoria: values.categoria });
      location.hash = params.toString();
      await loadCatalog();
    } else if (form.dataset.form === 'history') {
      const params = new URLSearchParams({ q: values.q, dias: values.dias, tipo: '' });
      location.hash = params.toString();
      await loadHistory();
    }
  } catch (error) {
    state.error = error.message;
    if (state.user) await loadPage();
    else renderAuth(form.dataset.mode || 'login');
  }
});

bootstrap();
