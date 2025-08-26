# 🚀 Lienzo Culinario Backend - Setup Local

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **PostgreSQL** (versión 14 o superior)
- **pgAdmin** (opcional, para gestionar la base de datos)

## 🗄️ Configuración de Base de Datos

### 1. Instalar PostgreSQL
- **macOS**: Descargar desde [postgresql.org](https://www.postgresql.org/download/macosx/)
- **Windows**: Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Crear Base de Datos
```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE lienzoCulinario;

-- Verificar que se creó
\l
```

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd lienzoback
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env.development` en la raíz del proyecto:

```env
# Variables de entorno para la base de datos
DB_NAME=lienzoCulinario
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_aqui

# Variables de entorno para Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_API_KEY=tu_api_key

# Variables de entorno para JWT
JWT_SECRET=tu_jwt_secret

# Variables de entorno para Stripe
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret
STRIPE_CURRENCY=usd

# Configuración de TypeORM
TYPEORM_SYNC=false
TYPEORM_DROP=false
NODE_ENV=development
PORT=3001
```

### 4. Compilar el proyecto
```bash
npm run build
```

### 5. Copiar plantillas de email
```bash
npm run copy:templates
```

### 6. Ejecutar migraciones
```bash
node run-migrations.js
```

## 🚀 Iniciar el Servidor

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run start:prod
```

El servidor estará disponible en: **http://localhost:3001**

## 📚 Comandos Útiles

```bash
# Compilar proyecto
npm run build

# Copiar plantillas de email
npm run copy:templates

# Ejecutar migraciones
node run-migrations.js

# Iniciar servidor de desarrollo
npm run start:dev

# Iniciar servidor de producción
npm run start:prod

# Linting
npm run lint

# Tests
npm run test
```

## 🔧 Solución de Problemas

### Error: "column does not exist"
- Verificar que las migraciones se ejecutaron correctamente
- Ejecutar: `node run-migrations.js`

### Error: "Cannot find module"
- Verificar que las dependencias están instaladas
- Ejecutar: `npm install`

### Error: "Connection refused"
- Verificar que PostgreSQL esté ejecutándose
- Verificar credenciales en `.env.development`

### Error: "Plantillas no encontradas"
- Ejecutar: `npm run copy:templates`

## 📁 Estructura del Proyecto

```
lienzoback/
├── src/
│   ├── modules/          # Módulos de la aplicación
│   ├── config/           # Configuraciones
│   └── migrations/       # Migraciones de base de datos
├── dist/                 # Archivos compilados
├── .env.development      # Variables de entorno
└── run-migrations.js     # Script de migraciones
```

## 🎯 Flujo de Desarrollo

1. **Configurar base de datos** (una sola vez)
2. **Instalar dependencias** (una sola vez)
3. **Configurar .env.development** (una sola vez)
4. **Compilar proyecto**: `npm run build`
5. **Copiar plantillas**: `npm run copy:templates`
6. **Ejecutar migraciones**: `node run-migrations.js` (solo si hay cambios)
7. **Iniciar servidor**: `npm run start:dev`

## 📞 Soporte

Si tienes problemas, verifica:
1. ✅ PostgreSQL está ejecutándose
2. ✅ Credenciales correctas en `.env.development`
3. ✅ Todas las dependencias instaladas
4. ✅ Proyecto compilado correctamente
5. ✅ Migraciones ejecutadas
