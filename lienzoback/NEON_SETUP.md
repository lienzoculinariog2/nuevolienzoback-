# 🌟 Configuración para Neon Database

## 📋 Pasos para migrar a Neon

### 1. Crear cuenta en Neon
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta (puedes usar GitHub)
3. Crea un nuevo proyecto
4. Anota la **Connection String** que te proporciona

### 2. Configurar variables de entorno

#### Para desarrollo local (.env.development):
```env
# Base de datos Neon
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Variables individuales (opcional)
DB_NAME=neondb
DB_HOST=ep-xxx-xxx.us-east-1.aws.neon.tech
DB_PORT=5432
DB_USERNAME=username
DB_PASSWORD=password

# Configuración de TypeORM
TYPEORM_SYNC=false
TYPEORM_DROP=false

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Stripe
STRIPE_SECRET_KEY=sk_test_tu_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_tu_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_tu_stripe_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_email@gmail.com
MAIL_PASS=tu_app_password

# Auth0 (opcional)
AUTH0_DOMAIN=tu_dominio.auth0.com
AUTH0_AUDIENCE=tu_audience

# Puerto del servidor
PORT=3001
```

#### Para producción (Render):
```env
# Solo necesitas esta variable en Render
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Ejecutar migraciones

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npm run migration:run

# O si prefieres usar el script personalizado
npm run migrate
```

### 4. Probar conexión

```bash
# Iniciar servidor de desarrollo
npm run start:dev
```

### 5. Actualizar Render

1. Ve a tu proyecto en Render
2. Ve a la sección "Environment"
3. Actualiza la variable `DATABASE_URL` con la nueva URL de Neon
4. Elimina las variables individuales de base de datos (DB_HOST, DB_PORT, etc.)
5. Redespliega la aplicación

## 🔧 Ventajas de Neon

- ✅ **Serverless**: No necesitas gestionar servidores
- ✅ **Escalado automático**: Se adapta a la demanda
- ✅ **Backup automático**: Respaldos continuos
- ✅ **Branching**: Puedes crear ramas de la base de datos
- ✅ **Gratuito**: Plan gratuito generoso
- ✅ **Compatible**: 100% compatible con PostgreSQL

## 🚨 Consideraciones importantes

1. **SSL requerido**: Neon siempre requiere SSL
2. **Connection pooling**: Neon maneja esto automáticamente
3. **Timeouts**: Configurados para 60 segundos
4. **Migraciones**: Ejecutar siempre en producción

## 🧪 Testing

```bash
# Verificar conexión
curl http://localhost:3001/health

# Verificar base de datos
npm run debug:env
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Neon
2. Verifica la URL de conexión
3. Confirma que las migraciones se ejecutaron
4. Revisa la configuración de SSL
