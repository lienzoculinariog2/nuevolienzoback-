# 🛒 Solución al Problema de Limpieza de Carrito

## 🚨 Problema Identificado

**Problema:** El carrito se estaba limpiando durante el checkout, antes de que el pago fuera exitoso. Esto causaba problemas si el pago fallaba, ya que el usuario perdía los items del carrito sin haber completado la compra.

## ✅ Solución Implementada

### **Nuevo Flujo Correcto:**

1. **✅ Checkout:** Solo valida y crea la orden, NO limpia el carrito
2. **✅ Pago Exitoso:** Descuenta stock Y limpia el carrito
3. **✅ Pago Fallido:** No descuenta stock Y NO limpia el carrito

### **Cambios Realizados:**

#### **1. Checkout Integration Service**
```typescript
// ANTES (problemático)
// 5. Crear la orden
const order = await this.createOrder(...);

// 6. Limpiar carrito después de crear la orden
await this.clearCart(cart.id); // ❌ Se limpia antes del pago

// 7. Crear payment intent
const paymentIntent = await this.paymentsService.createPaymentIntent(...);

// DESPUÉS (solución)
// 5. Crear la orden
const order = await this.createOrder(...);

// NOTA: El carrito se limpia cuando el pago sea exitoso, no aquí
// para evitar problemas si el pago falla

// 6. Crear payment intent
const paymentIntent = await this.paymentsService.createPaymentIntent(...);
```

#### **2. Payment Order Service (ÚNICO lugar donde se limpia)**
```typescript
async handlePaymentSuccess(paymentIntentId: string) {
  // ✅ Actualiza estado del pago a SUCCEEDED
  // ✅ Actualiza estado de la orden a COMPLETED
  // ✅ DESCUENTA STOCK (ÚNICA VEZ)
  
  // ✅ LIMPIA CARRITO (cuando el pago es exitoso)
  try {
    this.logger.log(`🔄 Limpiando carrito para usuario: ${payment.order.userId}`);
    await this.cartService.clearCart(payment.order.userId);
    this.logger.log(`✅ Carrito limpiado para usuario ${payment.order.userId} después del pago exitoso`);
  } catch (cartError) {
    this.logger.error(`❌ ERROR CRÍTICO: Failed to clear cart for user ${payment.order.userId}: ${cartError.message}`);
    // No lanzamos el error para no afectar el pago exitoso
  }
}
```

## 🔄 Flujo Actualizado

### **Paso 1: Checkout Completo**
```http
POST /checkout/:userId/complete
```
**Lo que sucede:**
- ✅ Valida usuario y carrito
- ✅ Valida stock disponible (NO descuenta)
- ✅ Calcula totales con descuento
- ✅ Crea orden en estado `PENDING`
- ✅ Marca código de descuento como usado
- ✅ Crea payment intent en Stripe
- ✅ **NO limpia carrito** (se limpia cuando el pago sea exitoso)

### **Paso 2: Pago Exitoso (Webhook)**
```typescript
// Cuando Stripe envía webhook de pago exitoso
handlePaymentSuccess(paymentIntentId: string) {
  // ✅ Actualiza estado del pago a SUCCEEDED
  // ✅ Actualiza estado de la orden a COMPLETED
  // ✅ DESCUENTA STOCK (ÚNICA VEZ)
  // ✅ LIMPIA CARRITO (cuando el pago es exitoso)
}
```

### **Paso 3: Pago Fallido (Webhook)**
```typescript
// Cuando Stripe envía webhook de pago fallido
handlePaymentFailure(paymentIntentId: string) {
  // ✅ Actualiza estado del pago a FAILED
  // ✅ Actualiza estado de la orden a FAILED
  // ✅ NO descuenta stock (nunca se descuento)
  // ✅ NO limpia carrito (el usuario puede reintentar)
}
```

## 📊 Beneficios

1. **✅ Experiencia de Usuario:** Si el pago falla, el usuario mantiene sus items en el carrito
2. **✅ Consistencia:** El carrito solo se limpia cuando la transacción es exitosa
3. **✅ Seguridad:** No se pierden items por fallos de pago
4. **✅ Reintentos:** El usuario puede reintentar el pago sin agregar items nuevamente

## 🧪 Casos de Uso

### **Caso 1: Pago Exitoso**
1. Usuario hace checkout → Carrito se mantiene
2. Pago exitoso → Stock se descuenta + Carrito se limpia
3. ✅ Usuario feliz, transacción completa

### **Caso 2: Pago Fallido**
1. Usuario hace checkout → Carrito se mantiene
2. Pago fallido → Stock NO se descuenta + Carrito se mantiene
3. ✅ Usuario puede reintentar sin perder items

### **Caso 3: Error de Red**
1. Usuario hace checkout → Carrito se mantiene
2. Error de red → Carrito se mantiene
3. ✅ Usuario puede reintentar cuando la conexión se restablezca

## 📝 Notas Importantes

- **Carrito se limpia SOLO cuando el pago es exitoso**
- **Si el pago falla, el usuario mantiene sus items**
- **El flujo es más robusto y user-friendly**
- **No hay riesgo de perder items por fallos de pago**

## 🔗 Archivos Modificados

- `src/modules/checkout/services/checkout-integration.service.ts` - Removida limpieza de carrito
- `src/modules/payments/payment-order.service.ts` - Único lugar donde se limpia carrito
- `docs/TROUBLESHOOTING/cart-cleanup-fix.md` (este archivo)
