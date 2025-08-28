# 🔍 Guía de Debugging del Sistema

Esta guía te ayudará a diagnosticar y resolver problemas en tu aplicación de Lienzo Culinario de manera sistemática y completa.

## 📋 Scripts de Debugging Disponibles

### 🎯 Script Maestro (Recomendado)
```bash
npm run debug:master
```
**O directamente:**
```bash
node debug-master.js
```

Este script ejecuta **todos** los debugging de manera ordenada:
1. ✅ Verifica si el servidor está ejecutándose
2. ✅ Revisa la configuración del entorno
3. ✅ Verifica todos los módulos del sistema
4. ✅ Hace debugging detallado de módulos problemáticos

### 🔧 Scripts Individuales

#### 1. Verificación de Configuración del Entorno
```bash
npm run debug:env
```
**O directamente:**
```bash
node debug-environment-config.js
```

**Verifica:**
- ✅ Estructura de archivos y directorios
- ✅ Configuración de package.json
- ✅ Variables de entorno en .env.development
- ✅ Configuración de TypeORM
- ✅ Estructura de módulos

#### 2. Verificación Completa del Sistema
```bash
npm run debug:system
```
**O directamente:**
```bash
node debug-complete-system.js
```

**Verifica:**
- ✅ Salud del servidor
- ✅ Conexión a base de datos
- ✅ Todos los módulos del sistema
- ✅ Endpoints y funcionalidades

#### 3. Debugging de Módulos Problemáticos
```bash
npm run debug:modules
```
**O directamente:**
```bash
node debug-problematic-modules.js
```

**Verifica en detalle:**
- 🔍 **Módulo de Notificaciones**
- 🔍 **Módulo de Checkout**
- 🔍 **Módulo de Pagos**

#### 4. Debugging de Inconsistencias
```bash
npm run debug:inconsistencies
```
**O directamente:**
```bash
node debug-inconsistencies.js
```

**Verifica:**
- 🔍 **Inconsistencias en datos** (productos sin stock en carritos, órdenes con estados inconsistentes)
- 🔍 **Inconsistencias en código** (imports faltantes, configuración incorrecta)
- 🔍 **Inconsistencias en lógica de negocio** (precios negativos, descuentos inválidos)

## 🚀 Cómo Usar el Debugging

### Paso 1: Preparación
1. Asegúrate de estar en el directorio del proyecto:
   ```bash
   cd lienzoback
   ```

2. Verifica que las dependencias estén instaladas:
   ```bash
   npm install
   ```

### Paso 2: Ejecutar Debugging Maestro
```bash
npm run debug:master
```

### Paso 3: Interpretar los Resultados

El script te mostrará un reporte detallado con:

- 🟢 **Verde**: Componentes funcionando correctamente
- 🟡 **Amarillo**: Advertencias (no críticas)
- 🔴 **Rojo**: Errores que requieren atención

### Paso 4: Seguir las Recomendaciones

El script te dará recomendaciones específicas para solucionar cualquier problema encontrado.

## 🔍 Módulos Específicos que Se Verifican

### 📧 Módulo de Notificaciones
- ✅ Estructura del módulo
- ✅ Templates de Handlebars
- ✅ Configuración de Nodemailer
- ✅ Variables de entorno de email
- ✅ Funcionalidad de newsletter

### 🛒 Módulo de Checkout
- ✅ Endpoints de checkout
- ✅ Integración con carrito
- ✅ Códigos de descuento
- ✅ Validación de productos
- ✅ Proceso de checkout

### 💳 Módulo de Pagos
- ✅ Endpoints de pagos
- ✅ Configuración de Stripe
- ✅ Webhook de Stripe
- ✅ Creación de intenciones de pago
- ✅ Confirmación de pagos

## 🛠️ Solución de Problemas Comunes

### Problema: Servidor no está ejecutándose
**Solución:**
```bash
npm run start:dev
```

### Problema: Variables de entorno faltantes
**Solución:**
1. Verifica que el archivo `.env.development` existe
2. Asegúrate de que todas las variables necesarias estén configuradas:
   ```
   DB_HOST=localhost
   DB_NAME=tu_base_de_datos
   DB_USERNAME=tu_usuario
   DB_PASSWORD=tu_password
   DB_PORT=5432
   JWT_SECRET=tu_jwt_secret
   STRIPE_SECRET_KEY=tu_stripe_key
   STRIPE_WEBHOOK_SECRET=tu_webhook_secret
   NODEMAILER_HOST=smtp.gmail.com
   NODEMAILER_PORT=587
   NODEMAILER_SECURE=false
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASSWORD=tu_password_de_app
   ```

### Problema: Dependencias faltantes
**Solución:**
```bash
npm install
```

### Problema: Base de datos no conecta
**Solución:**
1. Verifica que PostgreSQL esté ejecutándose
2. Verifica las credenciales en `.env.development`
3. Ejecuta las migraciones:
   ```bash
   npm run migration:run
   ```

## 📊 Interpretación de Reportes

### Estado: ✅ SALUDABLE
- Todos los componentes funcionan correctamente
- No se requieren acciones adicionales

### Estado: ⚠️ CON ADVERTENCIAS
- Algunos componentes tienen problemas menores
- Revisa las recomendaciones específicas

### Estado: ❌ CON PROBLEMAS
- Hay problemas críticos que requieren atención
- Sigue las recomendaciones para solucionarlos

## 🔄 Flujo de Debugging Recomendado

1. **Ejecuta el debugging maestro:**
   ```bash
   npm run debug:master
   ```

2. **Si hay problemas, ejecuta debugging específico:**
   ```bash
   npm run debug:env      # Para problemas de configuración
   npm run debug:modules  # Para problemas en módulos específicos
   ```

3. **Corrige los problemas identificados**

4. **Ejecuta nuevamente el debugging maestro para verificar**

5. **Repite hasta que todo esté funcionando correctamente**

## 📝 Logs y Reportes

Todos los scripts generan logs detallados que incluyen:
- ✅ Estado de cada verificación
- 🔍 Detalles específicos de problemas
- 💡 Recomendaciones de solución
- 📊 Resumen final

## 🆘 Obtener Ayuda

Si necesitas ayuda adicional:

1. **Revisa los logs del servidor:**
   ```bash
   npm run start:dev
   ```

2. **Ejecuta debugging específico del módulo problemático**

3. **Revisa la documentación de cada módulo**

4. **Verifica la configuración de variables de entorno**

## 🎯 Consejos para un Debugging Efectivo

1. **Ejecuta siempre el debugging maestro primero**
2. **Lee cuidadosamente todos los mensajes**
3. **Sigue las recomendaciones en orden**
4. **Verifica después de cada corrección**
5. **Mantén un registro de los cambios realizados**

---

**¡Con estos scripts tendrás un control completo sobre el estado de tu aplicación!** 🚀
