# 🎯 SOLUCIÓN COMPLETA: Problemas de Webhooks en Desarrollo Local

## 🚨 PROBLEMA IDENTIFICADO

**Los webhooks de Stripe están configurados para apuntar a Render (producción), pero estás trabajando en local.** Esto causa que:

- ❌ **Stock no se descuenta** (se descuenta solo cuando llega el webhook)
- ❌ **Carrito no se vacía** (se limpia solo cuando llega el webhook)
- ❌ **Códigos de descuento no se aplican** (se marcan como usados pero no se procesan)
- ❌ **Órdenes permanecen en estado PENDING**

## ✅ ANÁLISIS DEL MÓDULO PAYMENTS

### **Configuración Actual:**
- ✅ **Webhook Endpoint:** `/payments/webhook` configurado correctamente
- ✅ **Raw Body Middleware:** Configurado para preservar el body del webhook
- ✅ **CORS:** Incluye `stripe-signature` header
- ✅ **Logging:** Muy detallado para debugging
- ✅ **Event Handling:** Maneja todos los eventos importantes

### **Problema Principal:**
- ❌ **Webhooks no llegan** porque Stripe está configurado para enviar a Render, no a localhost

---

## 🚀 SOLUCIÓN: Configurar Webhooks para Desarrollo Local

### **OPCIÓN 1: Stripe CLI (RECOMENDADA)**

#### **Paso 1: Instalar Stripe CLI**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
choco install stripe-cli

# Linux
# Descargar desde: https://github.com/stripe/stripe-cli/releases
```

#### **Paso 2: Autenticarse**
```bash
stripe login
# Esto abrirá tu navegador para autenticarte
```

#### **Paso 3: Escuchar Webhooks**
```bash
stripe listen --forward-to localhost:3001/payments/webhook
# Esto te dará un webhook secret como: whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### **Paso 4: Configurar Variable de Entorno**
Agregar a `.env.development`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### **Paso 5: Probar**
```bash
# En otra terminal
stripe trigger payment_intent.succeeded
```

---

### **OPCIÓN 2: ngrok (Alternativa)**

#### **Paso 1: Instalar ngrok**
```bash
npm install -g ngrok
```

#### **Paso 2: Exponer Servidor**
```bash
ngrok http 3001
# Esto te dará una URL como: https://abc123.ngrok.io
```

#### **Paso 3: Configurar en Stripe Dashboard**
1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click en "Add endpoint"
3. URL: `https://abc123.ngrok.io/payments/webhook`
4. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copiar el webhook secret y agregarlo a `.env.development`

---

## 🧪 HERRAMIENTAS DE VERIFICACIÓN

### **Scripts Creados:**

1. **`npm run check:webhook`** - Verifica configuración de webhooks
2. **`npm run debug:checkout`** - Analiza problemas del checkout
3. **`npm run test:webhook`** - Simula webhook exitoso

### **Verificación Paso a Paso:**

```bash
# 1. Verificar configuración actual
npm run check:webhook

# 2. Iniciar servidor
npm run start:dev

# 3. Iniciar Stripe CLI (en otra terminal)
stripe listen --forward-to localhost:3001/payments/webhook

# 4. Crear orden desde frontend

# 5. Procesar pago desde frontend

# 6. Verificar que webhook llega (logs del servidor)

# 7. Verificar resultados
npm run debug:checkout
```

---

## 🔄 FLUJO COMPLETO DE PRUEBA

### **1. Configuración Inicial**
```bash
# Terminal 1: Servidor
npm run start:dev

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3001/payments/webhook
```

### **2. Crear Orden (Frontend)**
```javascript
const checkout = await fetch('/checkout/user123/complete', {
  method: 'POST',
  body: JSON.stringify({
    shippingAddress: 'Calle 123',
    discountCode: 'DESCUENTO20'
  })
});
```

### **3. Procesar Pago (Frontend)**
```javascript
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: elements.getElement(CardElement) }
});
```

### **4. Webhook se Procesa Automáticamente**
```bash
# Verificar logs del servidor:
# - "🔔 ===== WEBHOOK RECIBIDO ====="
# - "📦 ===== ACTUALIZANDO STOCK DE PRODUCTOS ====="
# - "🛒 ===== LIMPIANDO CARRITO ====="
```

### **5. Verificar Resultados**
```bash
# Verificar órdenes
curl -X GET http://localhost:3001/orders

# Verificar productos (stock)
curl -X GET http://localhost:3001/products

# Verificar carrito (debe estar vacío)
curl -X GET http://localhost:3001/cart/user123
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Problema 1: Webhook no llega**
```bash
# Verificar que stripe listen está funcionando
stripe listen --forward-to localhost:3001/payments/webhook

# Verificar logs del servidor
# Buscar: "🔔 ===== WEBHOOK RECIBIDO ====="
```

### **Problema 2: Error de firma**
```bash
# Verificar webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Debe coincidir con el de stripe listen
```

### **Problema 3: CORS Error**
```bash
# Verificar que el servidor está en puerto 3001
lsof -i :3001

# Verificar configuración de CORS en main.ts
```

### **Problema 4: Raw Body Error**
```bash
# Verificar middleware en main.ts
# Debe estar: app.use('/payments/webhook', express.raw({ type: 'application/json' }));
```

---

## 📊 MÉTRICAS DE ÉXITO

### **Antes de la Solución:**
- ❌ Stock no se descuenta
- ❌ Carrito no se limpia
- ❌ Códigos de descuento se pierden
- ❌ Órdenes permanecen en PENDING

### **Después de la Solución:**
- ✅ Stock se descuenta automáticamente
- ✅ Carrito se limpia automáticamente
- ✅ Códigos de descuento se procesan correctamente
- ✅ Órdenes se actualizan a COMPLETED

---

## 🔧 CONFIGURACIÓN DEL FRONTEND

### **Para Desarrollo Local:**
```javascript
// Configurar Stripe para desarrollo
const stripe = Stripe('pk_test_xxxxxxxxxxxxxxxxxxxxx', {
  apiVersion: '2025-07-30.basil',
});

// Al procesar el pago
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: elements.getElement(CardElement),
  },
});

if (error) {
  console.error('Error:', error);
} else if (paymentIntent.status === 'succeeded') {
  console.log('Pago exitoso!');
  // El webhook procesará automáticamente el stock y carrito
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Stripe CLI es la opción más fácil** para desarrollo local
2. **Los webhooks son críticos** para el funcionamiento del sistema
3. **Siempre verifica los logs** para debugging
4. **Mantén las claves de test** separadas de las de producción
5. **El webhook secret es diferente** para cada entorno

---

## 🚀 PRÓXIMOS PASOS

1. **Instalar Stripe CLI**
2. **Configurar webhook secret**
3. **Probar flujo completo**
4. **Verificar que stock y carrito se actualizan**
5. **Monitorear logs para debugging**

---

## 📚 DOCUMENTACIÓN ADICIONAL

- [Guía de Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks de Stripe](https://stripe.com/docs/webhooks)
- [Configuración de ngrok](https://ngrok.com/docs)
- [Análisis de problemas del checkout](./checkout-issues-analysis.md)
