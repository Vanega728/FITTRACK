CREATE DATABASE IF NOT EXISTS fittrack
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fittrack;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(190) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actividades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    duracion_min SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    distancia_km DECIMAL(8,2) NOT NULL DEFAULT 0,
    calorias SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    intensidad ENUM('Baja','Media','Alta') NOT NULL DEFAULT 'Media',
    notas VARCHAR(500) NULL,
    realizada_en DATETIME NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_actividad_usuario_fecha (usuario_id, realizada_en),
    CONSTRAINT fk_actividades_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ejercicios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    duracion_min SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    fecha DATE NOT NULL,
    notas VARCHAR(500) NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_ejercicios_usuario_fecha (usuario_id, fecha),
    CONSTRAINT fk_ejercicios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalogo_ejercicios (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    grupo_muscular VARCHAR(80) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    dificultad ENUM('Fácil','Media','Difícil') NOT NULL DEFAULT 'Media',
    duracion_min SMALLINT UNSIGNED NOT NULL DEFAULT 10,
    calorias SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    descripcion VARCHAR(500) NOT NULL,
    musculos VARCHAR(250) NOT NULL DEFAULT '',
    pasos TEXT NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY uq_catalogo_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO catalogo_ejercicios (nombre,grupo_muscular,categoria,dificultad,duracion_min,calorias,descripcion,musculos,pasos) VALUES
('Sentadilla con peso corporal','Piernas','Fuerza','Media',15,90,'Ejercicio base para fortalecer cuádriceps, glúteos y core.','Cuádriceps,Glúteos,Core','Párate con los pies al ancho de hombros.\nFlexiona cadera y rodillas manteniendo el pecho erguido.\nEmpuja el suelo y vuelve a la posición inicial.'),
('Flexiones','Pecho','Fuerza','Fácil',10,70,'Fortalece pecho, hombros y brazos usando el peso corporal.','Pecho,Hombros,Tríceps','Coloca las manos bajo los hombros.\nBaja el pecho con el cuerpo alineado.\nEmpuja hasta extender los brazos.'),
('Plancha abdominal','Core','Fuerza','Fácil',5,25,'Trabajo isométrico para fortalecer abdomen y estabilidad.','Core,Abdomen','Apoya antebrazos y puntas de pies.\nMantén el cuerpo recto y el abdomen activo.\nRespira con calma durante el tiempo elegido.'),
('Burpees','Cuerpo completo','HIIT','Difícil',12,130,'Movimiento de cuerpo completo que combina fuerza y cardio.','Piernas,Pecho,Core','Desde de pie, baja a una sentadilla.\nLleva los pies atrás y haz una flexión.\nRegresa los pies al frente y salta.'),
('Zancadas','Piernas','Fuerza','Media',12,75,'Ejercicio unilateral para piernas, equilibrio y estabilidad.','Cuádriceps,Glúteos','Da un paso al frente.\nBaja ambas rodillas con control.\nEmpuja con el pie delantero y alterna.'),
('Remo con mancuerna','Espalda','Fuerza','Media',15,80,'Fortalece espalda y brazos con una mancuerna.','Espalda,Bíceps','Inclina el torso con espalda neutral.\nLleva la mancuerna hacia la cadera.\nBaja despacio y completa las repeticiones.'),
('Saltar la cuerda','Cardio','Cardio','Media',10,115,'Actividad cardiovascular para coordinación y resistencia.','Pantorrillas,Hombros','Sujeta la cuerda a los lados.\nGírala desde las muñecas.\nSalta bajo y mantén un ritmo constante.'),
('Saludo al sol','Flexibilidad','Yoga','Fácil',20,55,'Secuencia de movilidad para activar y estirar el cuerpo.','Espalda,Piernas,Hombros','Inicia de pie y eleva los brazos.\nFlexiona el torso hacia delante.\nLleva una pierna atrás y fluye entre las posturas.');

CREATE TABLE IF NOT EXISTS rutinas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(500) NULL,
    frecuencia VARCHAR(120) NOT NULL DEFAULT '',
    ejercicios_texto VARCHAR(800) NULL,
    estado ENUM('Activa','Borrador','Completada') NOT NULL DEFAULT 'Activa',
    fecha DATE NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_rutinas_usuario_estado (usuario_id, estado),
    CONSTRAINT fk_rutinas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    objetivo DECIMAL(10,2) NOT NULL,
    actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    unidad VARCHAR(40) NOT NULL,
    tipo ENUM('Distancia','Calorías','Peso','Frecuencia','Tiempo','Otro') NOT NULL DEFAULT 'Otro',
    fecha_limite DATE NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_metas_usuario (usuario_id),
    CONSTRAINT fk_metas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comidas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    comida VARCHAR(80) NOT NULL,
    alimentos VARCHAR(500) NOT NULL,
    porcion VARCHAR(120) NOT NULL DEFAULT '1 porción',
    calorias SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    proteinas_g DECIMAL(7,2) NOT NULL DEFAULT 0,
    carbohidratos_g DECIMAL(7,2) NOT NULL DEFAULT 0,
    grasas_g DECIMAL(7,2) NOT NULL DEFAULT 0,
    consumida_en DATETIME NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_comidas_usuario_fecha (usuario_id, consumida_en),
    CONSTRAINT fk_comidas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS perfiles (
    usuario_id BIGINT UNSIGNED NOT NULL,
    peso_kg DECIMAL(5,2) NULL,
    altura_cm SMALLINT UNSIGNED NULL,
    fecha_nacimiento DATE NULL,
    genero ENUM('Femenino','Masculino','No especificar') NOT NULL DEFAULT 'No especificar',
    objetivo VARCHAR(200) NULL,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_perfiles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
