# 🔧 Solución al Problema de Descuento Doble de Stock

## 🚨 Problema Identificado

**Problema:** El stock de los productos se estaba descontando **DOS veces** durante el proceso de compra:

1. **Primera vez:** Durante la creación de la orden en el checkout
2. **Segunda vez:** Cuando el pago era exitoso

Esto causaba que el stock se redujera el doble de lo que debería.

## ✅ Solución Implementada

### **Nuevo Flujo Correcto:**

1. **✅ Crear Orden:** Solo se valida el stock disponible, NO se descuenta
2. **✅ Procesar Pago:** Se crea el payment intent
3. **✅ Pago Exitoso:** Se descuenta el stock UNA SOLA VEZ
4. **✅ Pago Fallido:** No se descuenta stock (nunca se descuento)

### **Cambios Realizados:**

#### **1. Checkout Integration Service**
```typescript
// ANTES (causaba descuento doble)
// Descontar stock de productos
for (const item of orderItems) {
  const product = await manager.findOne(Products, { where: { id: item.productId } });
  if (product) {
    product.stock -= item.quantity; // ❌ PRIMERA VEZ
    await manager.save(Products, product);
  }
}

// DESPUÉS (solución)
// NOTA: El stock se descuenta cuando el pago sea exitoso, no aquí
// para evitar descuentos dobles. Ver payment-order.service.ts
```

#### **2. Orders Service**
```typescript
// ANTES (causaba descuento doble)
product.stock -= itemDto.quantity; // ❌ PRIMERA VEZ
await manager.save(Products, product);

// DESPUÉS (solución)
// NOTA: El stock se descuenta cuando el pago sea exitoso, no aquí
// para evitar descuentos dobles. Ver payment-order.service.ts
// product.stock -= itemDto.quantity;
// await manager.save(Products, product);
```

#### **3. Payment Order Service (ÚNICO lugar donde se descuenta)**
```typescript
/**
 * Update product stock after successful payment
 * IMPORTANTE: Este es el ÚNICO lugar donde se debe descontar el stock
 * para evitar descuentos dobles. El stock NO se descuenta durante la creación de la orden.
 */
private async updateProductStock(orderId: string): Promise<void> {
  // ... validaciones ...
  
  // Decrease stock
  const newStock = product.stock - detail.quantity;
  product.stock = newStock; // ✅ ÚNICA VEZ
  
  await this.productsRepository.save(product);
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
}
```

## 📊 Beneficios

1. **✅ Stock Correcto:** Se descuenta solo una vez
2. **✅ Consistencia:** El stock refleja el estado real de los productos
3. **✅ Seguridad:** No se pierde stock por pagos fallidos
4. **✅ Trazabilidad:** Logs claros de cuándo se descuenta el stock

## 🧪 Pruebas

Para verificar que la solución funciona:

1. **Crear una orden con productos:**
```bash
curl -X POST /checkout/:userId/complete
```

2. **Verificar que el stock NO cambia:**
```bash
curl -X GET /products/:productId
# El stock debe ser el mismo que antes
```

3. **Simular pago exitoso:**
```bash
# Enviar webhook de Stripe payment_intent.succeeded
```

4. **Verificar que el stock SÍ cambia:**
```bash
curl -X GET /products/:productId
# El stock debe haberse reducido
```

## 📝 Notas Importantes

- **Stock se descuenta SOLO cuando el pago es exitoso**
- **No hay riesgo de perder stock por pagos fallidos**
- **El flujo es más seguro y consistente**
- **Los logs muestran claramente cuándo se descuenta el stock**

## 🔗 Archivos Modificados

- `src/modules/checkout/services/checkout-integration.service.ts` - Removida limpieza de carrito
- `src/modules/orders/orders.service.ts` - Removido descuento de stock
- `src/modules/payments/payment-order.service.ts` - Único lugar donde se descuenta stock y se limpia carrito
- `docs/TROUBLESHOOTING/stock-double-discount-fix.md` (este archivo)
