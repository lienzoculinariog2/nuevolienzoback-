# 🔧 Guía de Instalación - Lienzo Culinario Backend

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **PostgreSQL** (versión 12 o superior)
- **Git**

### Verificar instalaciones

```bash
# Verificar Node.js
node --version  # Debe ser v18+

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version

# Verificar Git
git --version
```

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/lienzoculinariog2/nuevolienzoback-.git

# Navegar al directorio del proyecto
cd nuevolienzoback-/lienzoback
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Verificar que no hay errores
npm audit
```

### 3. Configurar Base de Datos PostgreSQL

#### Crear Base de Datos

```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE lienzoCulinario;

-- Verificar que se creó
\l

-- Salir de psql
\q
```

#### Crear Usuario (Opcional)

```sql
-- Crear usuario específico
CREATE USER lienzo_user WITH PASSWORD 'tu_password';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE lienzoCulinario TO lienzo_user;
```

### 4. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.development

# Editar el archivo con tus credenciales
nano .env.development
```

#### Variables Requeridas

```env
# Base de Datos
DB_NAME=lienzoCulinario
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Configuración de TypeORM
TYPEORM_SYNC=true
TYPEORM_DROP=false
NODE_ENV=development
PORT=3001
```

#### Variables Opcionales (Cloudinary)

```env
# Cloudinary (para subida de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Variables Opcionales (Auth0)

```env
# Auth0 (para autenticación avanzada)
AUTH0_DOMAIN=tu_dominio.auth0.com
AUTH0_AUDIENCE=tu_audience
```

### 5. Ejecutar Migraciones

```bash
# Generar migraciones (si es necesario)
npm run migration:generate

# Ejecutar migraciones
npm run migration:run
```

### 6. Verificar Instalación

```bash
# Iniciar servidor de desarrollo
npm run start:dev
```

Deberías ver algo como:
```
[Nest] 1234  - 18/08/2025, 13:14:14     LOG [NestFactory] Starting Nest application...
✅ Cloudinary configurado correctamente
[Nest] 1234  - 18/08/2025, 13:14:14     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 1234  - 18/08/2025, 13:14:14     LOG [NestApplication] Nest application successfully started
```

### 7. Probar la API

```bash
# Verificar que el servidor está corriendo
curl http://localhost:3001/api

# Verificar Swagger UI
# Abrir en navegador: http://localhost:3001/api
```

## 🔧 Configuración Adicional

### Configurar Cloudinary (Opcional)

1. Crear cuenta en [Cloudinary](https://cloudinary.com/)
2. Obtener credenciales del Dashboard
3. Agregar variables al `.env.development`

### Configurar Auth0 (Opcional)

1. Crear aplicación en [Auth0](https://auth0.com/)
2. Configurar callback URLs
3. Obtener credenciales
4. Agregar variables al `.env.development`

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

## 🚀 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Servidor de desarrollo con hot reload |
| `npm run start:debug` | Servidor con debugging |
| `npm run start:prod` | Servidor de producción |
| `npm run build` | Compilar el proyecto |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:e2e` | Ejecutar tests e2e |
| `npm run migration:generate` | Generar migraciones |
| `npm run migration:run` | Ejecutar migraciones |

## 🔍 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL está corriendo
brew services list | grep postgresql

# Reiniciar PostgreSQL
brew services restart postgresql
```

### Error: "JWT_SECRET is not defined"

```bash
# Verificar variables de entorno
cat .env.development | grep JWT_SECRET

# Si está vacío, agregar un valor
echo "JWT_SECRET=tu_secret_super_seguro" >> .env.development
```

### Error: "Port 3001 is already in use"

```bash
# Encontrar proceso usando el puerto
lsof -i :3001

# Matar el proceso
kill -9 <PID>
```

## 📚 Recursos Adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de TypeORM](https://typeorm.io/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de Cloudinary](https://cloudinary.com/documentation)

## 🤝 Soporte

Si tienes problemas con la instalación:

1. Revisa la sección [Troubleshooting](../TROUBLESHOOTING/common-issues.md)
2. Verifica que todos los prerrequisitos están instalados
3. Abre un issue en el repositorio con el error específico
