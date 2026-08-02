# Configuración de Render para Lienzo Culinario Backend

## 🔧 Variables de Entorno Requeridas

### **Variables Principales:**

```env
NODE_ENV=production
TYPEORM_SYNC=false
TYPEORM_DROP=false
PORT=3001
```

### **Base de Datos PostgreSQL:**

Si usas **PostgreSQL de Render**:
- La variable `DATABASE_URL` se configura automáticamente
- No necesitas configurar nada adicional

Si usas **base de datos externa**:
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### **Variables de Seguridad:**

```env
JWT_SECRET=tu_jwt_secret_super_seguro_y_largo
```

### **Variables de Cloudinary (Opcional):**

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## 📋 Pasos para Configurar en Render:

1. **Ve a tu servicio en Render Dashboard**
2. **Haz clic en "Environment"**
3. **Agrega las variables una por una:**

### **Variables Esenciales:**
- `NODE_ENV` = `production`
- `TYPEORM_SYNC` = `false` ⚠️ **IMPORTANTE: Evita tablas duplicadas**
- `TYPEORM_DROP` = `false` ⚠️ **IMPORTANTE: Evita borrar datos**
- `PORT` = `3001`

### **Variables de Seguridad:**
- `JWT_SECRET` = (genera un secreto largo y seguro)

### **Variables de Cloudinary (si usas):**
- `CLOUDINARY_CLOUD_NAME` = tu cloud name
- `CLOUDINARY_API_KEY` = tu API key
- `CLOUDINARY_API_SECRET` = tu API secret

## 🚀 Scripts de Build y Deploy:

El `package.json` ya está configurado correctamente:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "npm run build && npm run copy:templates && node dist/main",
    "start:prod": "npm run build && npm run copy:templates && node dist/main"
  }
}
```

### **Verificación Pre-Deploy:**

Antes de hacer deploy, ejecuta este comando para verificar que todo esté correcto:

```bash
npm run verify:render
```

Este script verificará:
- ✅ Que el build se completó correctamente
- ✅ Que `dist/main.js` existe
- ✅ Que las plantillas están copiadas
- ✅ Que los scripts apuntan a la ruta correcta

## 🔍 Verificación de Configuración:

Cuando la aplicación se inicie en Render, deberías ver en los logs:

```
🔍 TypeORM Config Debug:
NODE_ENV: production
isProduction: true
DATABASE_URL: CONFIGURADO
TYPEORM_SYNC: false
TYPEORM_DROP: false
Final synchronize value: false
Final dropSchema value: false
```

## ⚠️ Puntos Importantes:

1. **`TYPEORM_SYNC=false`** - CRÍTICO para evitar tablas duplicadas
2. **`TYPEORM_DROP=false`** - CRÍTICO para evitar pérdida de datos
3. **`NODE_ENV=production`** - Necesario para usar `DATABASE_URL`
4. **SSL configurado automáticamente** para Render

## 🐛 Troubleshooting:

### **Error: Cannot find module '/opt/render/project/src/lienzoback/dist/src/main'**
**Solución:**
1. Verifica que los scripts en `package.json` apunten a `dist/main` (no `dist/src/main`)
2. Ejecuta `npm run verify:render` para verificar la configuración
3. Asegúrate de que el build se complete correctamente

### **Si ves tablas duplicadas:**
- Verifica que `TYPEORM_SYNC=false`
- Ejecuta el script de limpieza: `npm run clean-tables`

### **Si la aplicación no inicia:**
- Verifica que `DATABASE_URL` esté configurada
- Verifica que `NODE_ENV=production`
- Ejecuta `npm run verify:render` para verificar el build

### **Si hay errores de migración:**
- El servicio de migración se ejecuta automáticamente al iniciar
- Verifica los logs para ver si hay errores específicos

### **Si las plantillas de email no funcionan:**
- Verifica que el script `copy:templates` se ejecute correctamente
- Asegúrate de que las plantillas estén en `dist/modules/notifications/templates`
