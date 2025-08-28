# 🌐 Configuración de Webhooks de Stripe para Desarrollo Local

## 🚀 OPCIÓN 1: Stripe CLI (RECOMENDADA)

### **Paso 1: Instalar Stripe CLI**

```bash
# macOS (con Homebrew)
brew install stripe/stripe-cli/stripe

# Windows (con Chocolatey)
choco install stripe-cli

# Linux
# Descargar desde: https://github.com/stripe/stripe-cli/releases
```

### **Paso 2: Autenticarse con Stripe**

```bash
# Iniciar sesión con tu cuenta de Stripe
stripe login

# Esto abrirá tu navegador para autenticarte
# Copia la clave de acceso que te proporciona
```

### **Paso 3: Escuchar Webhooks Localmente**

```bash
# Escuchar webhooks y reenviarlos a tu servidor local
stripe listen --forward-to localhost:3001/payments/webhook

# Esto te dará un webhook signing secret como:
# Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

### **Paso 4: Configurar Variable de Entorno**

Agrega el webhook secret a tu `.env.development`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # El que te dio stripe listen
```

### **Paso 5: Probar Webhooks**

```bash
# En otra terminal, disparar un webhook de prueba
stripe trigger payment_intent.succeeded

# Esto enviará un webhook de prueba a tu servidor local
```

---

## 🌐 OPCIÓN 2: ngrok (Alternativa)

### **Paso 1: Instalar ngrok**

```bash
# Descargar desde: https://ngrok.com/download
# O con npm
npm install -g ngrok
```

### **Paso 2: Exponer tu servidor local**

```bash
# Exponer puerto 3001
ngrok http 3001

# Esto te dará una URL como: https://abc123.ngrok.io
```

### **Paso 3: Configurar Webhook en Stripe Dashboard**

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click en "Add endpoint"
3. URL: `https://abc123.ngrok.io/payments/webhook`
4. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Click en "Add endpoint"

### **Paso 4: Obtener Webhook Secret**

1. En el dashboard de Stripe, ve a Webhooks
2. Click en tu endpoint
3. Click en "Reveal" en "Signing secret"
4. Copia el secret y agrégalo a `.env.development`

---

## 🧪 OPCIÓN 3: Testing Manual (Para Debugging)

### **Script de Prueba de Webhook**

```bash
# Ejecutar el script que creamos
npm run test:webhook
```

### **Verificar Configuración**

```bash
# Verificar que el servidor está funcionando
curl -X GET http://localhost:3001/products

# Verificar que el endpoint de webhook responde
curl -X POST http://localhost:3001/payments/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": "data"}'
```

---

## 🔧 CONFIGURACIÓN DEL FRONTEND

### **Para Desarrollo Local:**

```javascript
// En tu frontend, configurar Stripe para desarrollo
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
  // El webhook debería procesar automáticamente
}
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Problema 1: Webhook no llega**

```bash
# Verificar que stripe listen está funcionando
stripe listen --forward-to localhost:3001/payments/webhook

# Verificar logs del servidor
# Deberías ver: "🔔 ===== WEBHOOK RECIBIDO ====="
```

### **Problema 2: Error de firma**

```bash
# Verificar que el webhook secret es correcto
echo $STRIPE_WEBHOOK_SECRET

# Verificar que coincide con el de stripe listen
```

### **Problema 3: CORS Error**

```bash
# Verificar que el servidor está en puerto 3001
lsof -i :3001

# Verificar configuración de CORS en main.ts
```

### **Problema 4: Raw Body Error**

```bash
# Verificar que el middleware está configurado correctamente
# En main.ts debe estar:
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
```

---

## 📊 VERIFICACIÓN DE FUNCIONAMIENTO

### **Paso 1: Crear una orden**

```bash
# Usar el checkout para crear una orden
curl -X POST http://localhost:3001/checkout/user123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "Calle 123",
    "discountCode": "DESCUENTO20"
  }'
```

### **Paso 2: Simular webhook exitoso**

```bash
# Con Stripe CLI
stripe trigger payment_intent.succeeded

# O con nuestro script
npm run test:webhook
```

### **Paso 3: Verificar resultados**

```bash
# Verificar que la orden se actualizó
curl -X GET http://localhost:3001/orders

# Verificar que el stock se descuento
curl -X GET http://localhost:3001/products

# Verificar que el carrito se limpió
curl -X GET http://localhost:3001/cart/user123
```

---

## 🔄 FLUJO COMPLETO DE PRUEBA

### **1. Iniciar Servidor**
```bash
npm run start:dev
```

### **2. Iniciar Stripe CLI**
```bash
stripe listen --forward-to localhost:3001/payments/webhook
```

### **3. Crear Orden (Frontend)**
```javascript
// En tu frontend
const checkout = await fetch('/checkout/user123/complete', {
  method: 'POST',
  body: JSON.stringify({
    shippingAddress: 'Calle 123',
    discountCode: 'DESCUENTO20'
  })
});
```

### **4. Procesar Pago (Frontend)**
```javascript
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: elements.getElement(CardElement) }
});
```

### **5. Webhook se Procesa Automáticamente**
```bash
# Verificar logs del servidor
# Deberías ver:
# - "🔔 ===== WEBHOOK RECIBIDO ====="
# - "📦 ===== ACTUALIZANDO STOCK DE PRODUCTOS ====="
# - "🛒 ===== LIMPIANDO CARRITO ====="
```

---

## 📝 NOTAS IMPORTANTES

1. **Stripe CLI es la opción más fácil** para desarrollo local
2. **ngrok es útil** si necesitas que Stripe envíe webhooks reales
3. **Los webhooks son críticos** para el funcionamiento del sistema
4. **Siempre verifica los logs** para debugging
5. **Mantén las claves de test** separadas de las de producción

---

## 🚀 PRÓXIMOS PASOS

1. **Instalar Stripe CLI**
2. **Configurar webhook secret**
3. **Probar flujo completo**
4. **Verificar que stock y carrito se actualizan**
5. **Monitorear logs para debugging**
