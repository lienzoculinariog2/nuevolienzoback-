# 🛒 Flujo de Checkout Completo - Lienzo Culinario

## 📋 Resumen del Flujo

El nuevo flujo de checkout completo maneja todo el proceso de compra en una sola transacción, incluyendo:
- ✅ Validación de stock
- ✅ Creación de orden
- ✅ Descuento de stock
- ✅ Limpieza de carrito
- ✅ Creación de payment intent
- ✅ Aplicación de códigos de descuento

## 🔄 Flujo Completo

### **Paso 1: Checkout Completo**
```http
POST /checkout/:userId/complete
Content-Type: application/json

{
  "shippingAddress": "Calle Principal 123, Ciudad",
  "discountCode": "DESCUENTO20" // opcional
}
```

**Respuesta:**
```json
{
  "orderId": "uuid-de-la-orden",
  "paymentIntent": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 100.50,
    "currency": "usd"
  },
  "message": "Checkout procesado exitosamente. Procede con el pago."
}
```

**Lo que sucede internamente:**
1. ✅ Valida usuario y carrito
2. ✅ Valida stock disponible
3. ✅ Calcula totales con descuento
4. ✅ Crea orden en estado `PENDING`
5. ✅ Descuenta stock de productos
6. ✅ Limpia carrito del usuario
7. ✅ Marca código de descuento como usado
8. ✅ Crea payment intent en Stripe

### **Paso 2: Crear Payment Intent**
```http
POST /payments/order/:orderId/create-payment
Content-Type: application/json

{
  "customerEmail": "cliente@ejemplo.com",
  "description": "Pago para orden #12345"
}
```

**Respuesta:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 100.50,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### **Paso 3: Procesar Pago en Frontend**
```javascript
// Usar Stripe.js para procesar el pago
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: elements.getElement(CardElement),
  },
});

if (error) {
  // Manejar error
} else if (paymentIntent.status === 'succeeded') {
  // Pago exitoso
}
```

### **Paso 4: Confirmar Pago (Opcional)**
```http
POST /payments/confirm-payment/:orderId
```

**Respuesta:**
```json
{
  "message": "Pago confirmado exitosamente",
  "orderId": "uuid-de-la-orden",
  "paymentIntentId": "pi_xxx",
  "status": "completed",
  "actions": [
    "Estado de pago actualizado",
    "Estado de orden actualizado"
  ]
}
```

### **Paso 5: Verificar Estado**
```http
GET /payments/order-status/:orderId
```

**Respuesta:**
```json
{
  "orderId": "uuid-de-la-orden",
  "hasPaymentIntent": true,
  "paymentIntentId": "pi_xxx",
  "paymentStatus": "succeeded",
  "amount": 100.50,
  "currency": "usd",
  "isPaid": true,
  "orderStatus": "completed"
}
```

## 🚨 Manejo de Errores

### **Error: Stock Insuficiente**
```json
{
  "statusCode": 400,
  "message": "Stock insuficiente para Pizza Margarita. Disponible: 2, Solicitado: 5"
}
```

### **Error: Carrito Vacío**
```json
{
  "statusCode": 400,
  "message": "El carrito está vacío"
}
```

### **Error: Código de Descuento Inválido**
```json
{
  "statusCode": 404,
  "message": "Código de descuento no válido"
}
```

## 🔍 Endpoints de Diagnóstico

### **Diagnosticar Carrito**
```http
GET /checkout/diagnose/:userId
```

### **Diagnosticar Orden y Pago**
```http
GET /payments/diagnose/:orderId
```

### **Forzar Actualización (Debugging)**
```http
POST /payments/force-update/:orderId
```

### **Probar Flujo Completo (Debugging)**
```http
POST /payments/test-payment-flow/:orderId
```

## 📊 Estados de Orden

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Orden creada, pendiente de pago |
| `PROCESSING` | Pago en procesamiento |
| `COMPLETED` | Pago exitoso, orden completada |
| `CANCELLED` | Orden cancelada |
| `FAILED` | Pago fallido |

## 📊 Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Payment intent creado |
| `PROCESSING` | Pago en procesamiento |
| `SUCCEEDED` | Pago exitoso |
| `FAILED` | Pago fallido |
| `CANCELED` | Pago cancelado |

## 🔧 Ventajas del Nuevo Flujo

### **✅ Ventajas:**
1. **Transacción Atómica**: Todo se procesa en una sola transacción
2. **Sin Dependencia del Webhook**: No depende de que llegue el webhook
3. **Stock Garantizado**: El stock se descuenta inmediatamente
4. **Carrito Limpio**: El carrito se limpia inmediatamente
5. **Estados Consistentes**: No hay estados inconsistentes
6. **Mejor UX**: El usuario ve resultados inmediatos

### **⚠️ Consideraciones:**
1. **Stock Reservado**: Si el pago falla, el stock queda reservado
2. **Rollback Manual**: En caso de pago fallido, se necesita rollback manual
3. **Webhook Redundante**: El webhook solo actualiza estados, no procesa datos

## 🚀 Implementación en Frontend

### **Ejemplo de Implementación:**
```javascript
async function processCheckout(userId, checkoutData) {
  try {
    // 1. Checkout completo
    const checkoutResponse = await fetch(`/checkout/${userId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData)
    });
    
    const { orderId, paymentIntent } = await checkoutResponse.json();
    
    // 2. Crear payment intent
    const paymentResponse = await fetch(`/payments/order/${orderId}/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: user.email,
        description: `Pago para orden #${orderId}`
      })
    });
    
    const paymentData = await paymentResponse.json();
    
    // 3. Procesar pago con Stripe
    const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
      paymentData.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (confirmedPayment.status === 'succeeded') {
      // 4. Confirmar pago (opcional)
      await fetch(`/payments/confirm-payment/${orderId}`, {
        method: 'POST'
      });
      
      // 5. Redirigir a página de éxito
      window.location.href = `/success?orderId=${orderId}`;
    }
    
  } catch (error) {
    console.error('Error en checkout:', error);
    // Manejar error
  }
}
```

## 🔍 Monitoreo y Debugging

### **Logs Importantes:**
- `Iniciando checkout completo para usuario: {userId}`
- `Stock actualizado para producto {name}: -{quantity} (nuevo stock: {stock})`
- `Checkout completado exitosamente. Orden: {orderId}, Payment Intent: {paymentIntentId}`
- `Pago confirmado exitosamente para orden {orderId}`

### **Métricas a Monitorear:**
- Tiempo de respuesta del checkout
- Tasa de éxito de pagos
- Errores de stock insuficiente
- Errores de códigos de descuento
- Tiempo de procesamiento de payment intents
