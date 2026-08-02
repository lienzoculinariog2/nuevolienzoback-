# 🔧 Solución al Error de Metadata de Stripe

## 🚨 Problema

**Error:** `Metadata values can have up to 500 characters, but you passed in a value that is 589 characters`

**Causa:** El sistema estaba enviando toda la información de los productos (nombres, precios, cantidades) como metadata en el payment intent de Stripe. Cuando se compran 4 o más productos con nombres largos, el JSON resultante excede el límite de 500 caracteres de Stripe.

## ✅ Solución Implementada

### 1. **Reducción de Metadata**
En lugar de enviar toda la información de los items, ahora solo se envía información esencial:

```typescript
// ANTES (causaba error)
metadata: {
  orderId,
  items: JSON.stringify(orderSummary.items), // ❌ Demasiado largo
  idempotencyKey
}

// DESPUÉS (solución)
metadata: {
  orderId,
  itemCount: orderSummary.items.length.toString(), // ✅ Solo el conteo
  totalAmount: orderSummary.amount.toString(), // ✅ Solo el total
  idempotencyKey
}
```

### 2. **Nuevo Endpoint para Obtener Items**
Se agregó un endpoint para obtener la información de los items cuando sea necesario:

```http
GET /payments/order/:orderId/items
```

**Respuesta:**
```json
{
  "orderId": "uuid-de-la-orden",
  "items": [
    {
      "productId": "uuid",
      "productName": "Ensalada Keto de Pollo y Aguacate",
      "quantity": 1,
      "unitPrice": 6.00,
      "totalPrice": 6.00
    }
  ],
  "itemCount": 4
}
```

### 3. **Método Auxiliar en el Servicio**
Se agregó un método en `PaymentsService` para obtener los items:

```typescript
async getOrderItems(orderId: string): Promise<any[]>
```

## 🔄 Flujo Actualizado

### **Antes (Problemático):**
1. ✅ Crear payment intent con metadata completa
2. ❌ **Error:** Metadata excede 500 caracteres
3. ❌ **Fallo:** No se puede procesar el pago

### **Después (Solución):**
1. ✅ Crear payment intent con metadata mínima
2. ✅ **Éxito:** Payment intent creado correctamente
3. ✅ **Opcional:** Obtener items via endpoint si es necesario

## 📊 Beneficios

1. **✅ Compatibilidad:** Funciona con cualquier cantidad de productos
2. **✅ Rendimiento:** Metadata más ligera y rápida
3. **✅ Flexibilidad:** Información de items disponible cuando se necesite
4. **✅ Seguridad:** Información sensible no expuesta en metadata de Stripe

## 🧪 Pruebas

Para verificar que la solución funciona:

1. **Crear una orden con 4+ productos:**
```bash
curl -X POST /checkout/:userId/complete
```

2. **Verificar que el payment intent se crea:**
```bash
curl -X GET /payments/order/:orderId/payment-status
```

3. **Obtener items si es necesario:**
```bash
curl -X GET /payments/order/:orderId/items
```

## 📝 Notas Importantes

- **Metadata de Stripe:** Ahora solo contiene información esencial
- **Información de Items:** Disponible via endpoint dedicado
- **Compatibilidad:** Funciona con cualquier cantidad de productos
- **Seguridad:** No se expone información sensible en metadata

## 🔗 Archivos Modificados

- `src/modules/payments/payments.service.ts`
- `src/modules/payments/payments.controller.ts`
- `docs/TROUBLESHOOTING/stripe-metadata-fix.md` (este archivo)
