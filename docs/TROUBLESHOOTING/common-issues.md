# 🔍 Problemas Comunes y Soluciones - Lienzo Culinario

## 🚨 Problemas de Base de Datos

### Error: "Cannot connect to database"

**Síntomas:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Soluciones:**

1. **Verificar que PostgreSQL esté corriendo:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Si no está corriendo:
   brew services start postgresql
   ```

2. **Verificar credenciales en .env.development:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu_password
   DB_NAME=lienzoCulinario
   ```

3. **Crear base de datos si no existe:**
   ```sql
   psql -U postgres
   CREATE DATABASE lienzoCulinario;
   \q
   ```

### Error: "JWT_SECRET is not defined"

**Síntomas:**
```
Error: JWT_SECRET is not defined
```

**Solución:**
```bash
# Agregar JWT_SECRET al .env.development
echo "JWT_SECRET=tu_secret_super_seguro_y_largo" >> .env.development
```

### Error: "Port 3001 is already in use"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Soluciones:**

1. **Encontrar proceso usando el puerto:**
   ```bash
   lsof -i :3001
   ```

2. **Matar el proceso:**
   ```bash
   kill -9 <PID>
   ```

3. **O cambiar el puerto en .env.development:**
   ```env
   PORT=3002
   ```

## 🖼️ Problemas con Cloudinary

### Error: "Cloudinary not configured"

**Síntomas:**
```
Error: Cloudinary no está configurado
```

**Soluciones:**

1. **Verificar variables de entorno:**
   ```env
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```

2. **Obtener credenciales de Cloudinary:**
   - Ir a [Cloudinary Dashboard](https://cloudinary.com/console)
   - Copiar Cloud Name, API Key y API Secret

3. **Probar configuración:**
   ```bash
   curl http://localhost:3001/file/test/cloudinary-config
   ```

### Error: "Image upload failed"

**Síntomas:**
```
Error: Error al subir imagen
```

**Soluciones:**

1. **Verificar formato de imagen:**
   - Formatos soportados: JPG, PNG, GIF, WebP
   - Tamaño máximo: 5MB

2. **Verificar archivo:**
   ```bash
   file tu_imagen.jpg
   ls -la tu_imagen.jpg
   ```

## 🔐 Problemas de Autenticación

### Error: "Unauthorized"

**Síntomas:**
```
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Soluciones:**

1. **Verificar token JWT:**
   ```bash
   # Obtener token válido
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "usuario@ejemplo.com",
       "password": "password123"
     }'
   ```

2. **Usar token en requests:**
   ```bash
   curl -H "Authorization: Bearer <tu-token>" \
     http://localhost:3001/auth/profile
   ```

### Error: "Token expired"

**Síntomas:**
```
{
  "statusCode": 401,
  "message": "Token expired"
}
```

**Solución:**
```bash
# Hacer login nuevamente para obtener nuevo token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

## 📦 Problemas de Dependencias

### Error: "Module not found"

**Síntomas:**
```
Error: Cannot find module '@nestjs/...'
```

**Soluciones:**

1. **Reinstalar dependencias:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verificar package.json:**
   ```bash
   npm audit
   npm audit fix
   ```

### Error: "TypeScript compilation failed"

**Síntomas:**
```
TypeScript compilation failed
```

**Soluciones:**

1. **Limpiar cache:**
   ```bash
   npm run build -- --clean
   ```

2. **Verificar tipos:**
   ```bash
   npx tsc --noEmit
   ```

## 🚀 Problemas de Despliegue

### Error: "Environment variables not found"

**Síntomas:**
```
Error: Required environment variable is not set
```

**Soluciones:**

1. **Verificar variables en Render:**
   - Ir a tu proyecto en Render
   - Sección "Environment"
   - Agregar variables faltantes

2. **Variables requeridas:**
   ```env
   DB_NAME=lienzoCulinario
   DB_HOST=tu_host
   DB_PORT=5432
   DB_USERNAME=tu_username
   DB_PASSWORD=tu_password
   JWT_SECRET=tu_secret
   ```

### Error: "Build failed"

**Síntomas:**
```
Build failed: npm run build
```

**Soluciones:**

1. **Verificar logs de build:**
   - Revisar logs completos en Render
   - Buscar errores específicos

2. **Probar build localmente:**
   ```bash
   npm run build
   ```

## 🧪 Problemas de Testing

### Error: "Tests failing"

**Síntomas:**
```
FAIL  src/modules/products/products.service.spec.ts
```

**Soluciones:**

1. **Ejecutar tests individuales:**
   ```bash
   npm test -- --testNamePattern="nombre del test"
   ```

2. **Verificar base de datos de test:**
   ```bash
   # Crear base de datos de test
   createdb lienzoCulinario_test
   ```

## 📝 Problemas de Validación

### Error: "Validation failed"

**Síntomas:**
```
{
  "statusCode": 400,
  "message": ["name should not be empty"]
}
```

**Soluciones:**

1. **Verificar datos enviados:**
   ```bash
   # Usar curl con -v para ver request completo
   curl -v -X POST http://localhost:3001/products \
     -H "Content-Type: application/json" \
     -d '{"name": "Producto", "price": 29.99}'
   ```

2. **Revisar DTOs:**
   - Verificar campos requeridos
   - Verificar tipos de datos

## 🔧 Problemas de Performance

### Error: "Request timeout"

**Síntomas:**
```
Request timeout after 30s
```

**Soluciones:**

1. **Optimizar consultas:**
   - Usar índices en base de datos
   - Implementar paginación

2. **Verificar conexiones:**
   ```bash
   # Verificar conexiones activas
   psql -U postgres -d lienzoCulinario -c "SELECT count(*) FROM pg_stat_activity;"
   ```

## 📞 Obtener Ayuda

### Logs del Servidor

```bash
# Ver logs en tiempo real
npm run start:dev

# O con más detalle
DEBUG=* npm run start:dev
```

### Verificar Estado de la API

```bash
# Health check
curl http://localhost:3001/health

# Swagger UI
# Abrir en navegador: http://localhost:3001/api
```

### Comandos Útiles

```bash
# Verificar estado de servicios
brew services list

# Verificar puertos en uso
lsof -i :3001

# Verificar variables de entorno
cat .env.development

# Verificar base de datos
psql -U postgres -d lienzoCulinario -c "\dt"
```

## 🆘 Contacto

Si el problema persiste:

1. **Revisar issues existentes** en el repositorio
2. **Crear nuevo issue** con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Logs de error
   - Versión de Node.js y npm
   - Sistema operativo

3. **Información útil para debugging:**
   ```bash
   node --version
   npm --version
   psql --version
   cat .env.development
   ```
