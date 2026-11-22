# FITTRACK

Aplicación para registrar entrenamientos, ejercicios, rutinas, metas, historial, nutrición y perfil. La interfaz estática y la API Node.js están preparadas para Vercel; los datos se guardan en una base de datos MySQL/MariaDB externa.

## Requisitos

- Node.js 20 o superior.
- MySQL/MariaDB accesible desde internet y con la estructura de `database/fittrack.sql`.
- Una variable `SESSION_SECRET` de al menos 32 caracteres aleatorios.

## Variables de entorno

Configura estas variables en Vercel, en **Project Settings → Environment Variables**. No las subas al repositorio:

| Variable | Descripción |
| --- | --- |
| `DB_HOST` | Host público de MySQL/MariaDB |
| `DB_PORT` | Puerto, normalmente `3306` |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `DB_SSL` | `true` si el proveedor requiere TLS; de lo contrario `false` |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres |

La base debe aceptar conexiones desde Vercel. Importa `database/fittrack.sql` en el proveedor antes de probar el registro. Si el proveedor ya creó la base, elimina las instrucciones `CREATE DATABASE` y `USE` al importar el script. Mantén las credenciales solo en las variables de entorno de Vercel; `.env.example` es una plantilla sin secretos.

## Desarrollo local

1. Crea una base `fittrack` y ejecuta `database/fittrack.sql`.
2. Copia `.env.example` a `.env` y completa las variables de conexión y un secreto seguro.
3. Ejecuta `npm install`.
4. Ejecuta localmente la función con Vercel CLI (`vercel dev`) o publica el proyecto en Vercel.

## Publicar

1. Sube el proyecto a `Vanega728/FITTRACK` en GitHub.
2. En Vercel, importa ese repositorio y configura las variables de entorno descritas arriba.
3. Despliega. Vercel sirve la interfaz de `public/` y ejecuta `api/[...path].js` como una función Node.js.
4. Importa el esquema MySQL y verifica el registro, el inicio de sesión y las operaciones de cada módulo.

La API devuelve un error explícito hasta que estén configurados `SESSION_SECRET` y los datos de conexión. El proyecto no contiene la base de datos ni credenciales de producción.
