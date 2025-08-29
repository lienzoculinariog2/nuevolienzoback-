# 🔍 Análisis Completo del Módulo Discount-Codes

## 📋 Resumen del Problema

**Problema Principal:** Los códigos de descuento no se almacenaban correctamente en la base de datos cuando eran utilizados, causando inconsistencias y posibles reutilizaciones no autorizadas.

## 🔍 Análisis Detallado

### **✅ ASPECTOS BIEN IMPLEMENTADOS:**

1. **Estructura de Entidades Correcta:**
   - `DiscountCodes`: Entidad principal con campos apropiados
   - `DiscountCodesUsed`: Entidad para registrar uso con relaciones correctas
   - Relaciones bien definidas entre entidades

2. **Validaciones Implementadas:**
   - Verificación de códigos activos
   - Validación de fechas de expiración
   - Control de uso único por usuario
   - Verificación de códigos ya utilizados

3. **Servicios Funcionales:**
   - CRUD completo para códigos de descuento
   - Validación de códigos antes de uso
   - Filtros y búsquedas implementadas

### **❌ PROBLEMAS CRÍTICOS IDENTIFICADOS:**

#### **1. PROBLEMA PRINCIPAL: Timing Incorrecto del Registro**

**El problema estaba en el flujo de checkout:** Los códigos de descuento se marcaban como usados **DURANTE la creación de la orden**, pero si el pago fallaba, el código ya estaba marcado como usado sin posibilidad de reutilización.

**Ubicación del problema:**
```typescript
// En checkout-integration.service.ts línea 375 (ANTES)
if (discountCode) {
  const discountUsed = this.discountCodesUsedRepository.create({
    discountCode: { id: discountCode.id },
    user: { id: userId },
    order: savedOrder,
    usedAt: new Date(),
  });
  await manager.save(DiscountCodesUsed, discountUsed); // ❌ SE MARCA COMO USADO ANTES DEL PAGO
}
```

#### **2. PROBLEMA DE TIMING:**
- **Orden de operaciones incorrecto:**
  1. ✅ Se valida el código de descuento
  2. ✅ Se crea la orden
  3. ❌ **Se marca el código como usado** (AQUÍ ESTABA EL PROBLEMA)
  4. ✅ Se crea el payment intent
  5. ❌ Si el pago falla, el código ya está marcado como usado

#### **3. PROBLEMA DE CONSISTENCIA:**
- No había rollback del código de descuento si el pago fallaba
- No había mecanismo para "liberar" códigos de descuento en caso de fallo

## 🔧 SOLUCIONES IMPLEMENTADAS

### **Solución 1: Mover el Registro al Momento del Pago Exitoso**

#### **Cambios en checkout-integration.service.ts:**
```typescript
// ANTES (causaba el problema)
if (discountCode) {
  const discountUsed = this.discountCodesUsedRepository.create({
    discountCode: { id: discountCode.id },
    user: { id: userId },
    order: savedOrder,
    usedAt: new Date(),
  });
  await manager.save(DiscountCodesUsed, discountUsed); // ❌ PRIMERA VEZ
}

// DESPUÉS (solución)
// NOTA: El código de descuento se marca como usado cuando el pago sea exitoso, no aquí
// para evitar marcar códigos como usados si el pago falla. Ver payment-order.service.ts
// if (discountCode) {
//   const discountUsed = this.discountCodesUsedRepository.create({
//     discountCode: { id: discountCode.id },
//     user: { id: userId },
//     order: savedOrder,
//     usedAt: new Date(),
//   });
//   await manager.save(DiscountCodesUsed, discountUsed);
// }
```

#### **Cambios en orders.service.ts:**
```typescript
// ANTES (causaba el problema)
if (discount) {
  const discountUsed = new DiscountCodesUsed();
  discountUsed.order = newOrder;
  discountUsed.discountCode = discount;
  discountUsed.usedAt = new Date();
  discountUsed.user = user;

  await manager.save(DiscountCodesUsed, discountUsed); // ❌ PRIMERA VEZ
}

// DESPUÉS (solución)
// NOTA: El código de descuento se marca como usado cuando el pago sea exitoso, no aquí
// para evitar marcar códigos como usados si el pago falla. Ver payment-order.service.ts
// if (discount) {
//   const discountUsed = new DiscountCodesUsed();
//   discountUsed.order = newOrder;
//   discountUsed.discountCode = discount;
//   discountUsed.usedAt = new Date();
//   discountUsed.user = user;

//   await manager.save(DiscountCodesUsed, discountUsed);
// }
```

### **Solución 2: Almacenar el ID del Código de Descuento en la Orden**

#### **Nueva columna en la entidad Orders:**
```typescript
// En order.entity.ts
@Column({ name: 'discount_code_id', type: 'uuid', nullable: true })
discountCodeId: string;
```

#### **Almacenar el ID durante la creación de la orden:**
```typescript
// En checkout-integration.service.ts
const order = this.ordersRepository.create({
  user: { id: userId },
  totalAmount: finalTotal,
  status: OrderStatus.PENDING,
  shippingAddress,
  date: new Date(),
  discountCodeId: discountCode?.id, // ✅ NUEVO: Almacenar el ID del código de descuento
});
```

### **Solución 3: Registrar el Uso en el Pago Exitoso**

#### **Nuevo método en payment-order.service.ts:**
```typescript
/**
 * Mark discount code as used after successful payment
 * IMPORTANTE: Este es el ÚNICO lugar donde se debe marcar el código como usado
 * para evitar marcar códigos como usados si el pago falla.
 */
private async markDiscountCodeAsUsed(orderId: string): Promise<void> {
  try {
    this.logger.log('🎫 ===== MARCANDO CÓDIGO DE DESCUENTO COMO USADO =====');
    
    // Get order with user information
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      this.logger.warn(`⚠️ Orden ${orderId} no encontrada`);
      return;
    }

    // Check if the order has a discount code ID stored
    if (order.discountCodeId) {
      this.logger.log(`🎫 Código de descuento encontrado en la orden: ${order.discountCodeId}`);
      
      // Get the discount code details
      const discountCode = await this.discountCodesRepository.findOne({
        where: { id: order.discountCodeId },
      });

      if (!discountCode) {
        this.logger.warn(`⚠️ Código de descuento ${order.discountCodeId} no encontrado`);
        return;
      }

      this.logger.log(`🎫 Código de descuento: ${discountCode.code} (${discountCode.percentage}%)`);

      // Create the discount code used record
      const discountUsed = this.discountCodesUsedRepository.create({
        discountCode: { id: order.discountCodeId },
        user: { id: order.userId },
        order: { id: orderId },
        usedAt: new Date(),
      });

      await this.discountCodesUsedRepository.save(discountUsed);
      this.logger.log(`✅ Código de descuento ${discountCode.code} marcado como usado exitosamente`);
    } else {
      this.logger.log(`ℹ️ No se aplicó código de descuento en esta orden`);
    }
  } catch (error) {
    this.logger.error(`❌ ERROR en markDiscountCodeAsUsed: ${error.message}`);
    // Don't throw error here as the payment was successful
    // Just log it for monitoring
  }
}
```

#### **Llamada en handlePaymentSuccess:**
```typescript
async handlePaymentSuccess(paymentIntentId: string) {
  try {
    // ... código existente ...

    // Update product stock
    this.logger.log('🔄 Actualizando stock de productos...');
    await this.updateProductStock(payment.orderId);
    this.logger.log('✅ Stock de productos actualizado');

    // Mark discount code as used (if any)
    this.logger.log('🔄 Marcando código de descuento como usado...');
    await this.markDiscountCodeAsUsed(payment.orderId);
    this.logger.log('✅ Código de descuento marcado como usado');

    // Clear the user's cart after successful payment
    // ... resto del código ...
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

### **Solución 4: Migración de Base de Datos**

#### **Nueva migración: 1703123456796-AddDiscountCodeIdToOrders.ts**
```typescript
export class AddDiscountCodeIdToOrders1703123456796 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar la columna discount_code_id
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "discount_code_id" uuid NULL
    `);

    // Agregar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD CONSTRAINT "FK_orders_discount_code_id_discount_codes" 
      FOREIGN KEY ("discount_code_id") 
      REFERENCES "discount_codes"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP CONSTRAINT IF EXISTS "FK_orders_discount_code_id_discount_codes"
    `);

    // Eliminar la columna
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "discount_code_id"
    `);
  }
}
```

## 🔄 Nuevo Flujo Correcto

### **Paso 1: Checkout Completo**
```http
POST /checkout/:userId/complete
```
**Lo que sucede:**
- ✅ Valida usuario y carrito
- ✅ Valida stock disponible (NO descuenta)
- ✅ Calcula totales con descuento
- ✅ Crea orden en estado `PENDING`
- ✅ **Almacena el ID del código de descuento en la orden**
- ✅ Crea payment intent en Stripe
- ✅ **NO marca el código como usado** (se marca cuando el pago sea exitoso)

### **Paso 2: Pago Exitoso (Webhook)**
```typescript
// Cuando Stripe envía webhook de pago exitoso
handlePaymentSuccess(paymentIntentId: string) {
  // ✅ Actualiza estado del pago a SUCCEEDED
  // ✅ Actualiza estado de la orden a COMPLETED
  // ✅ DESCUENTA STOCK (ÚNICA VEZ)
  // ✅ MARCA CÓDIGO DE DESCUENTO COMO USADO (ÚNICA VEZ)
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
  // ✅ NO marca código como usado (nunca se marcó)
  // ✅ NO limpia carrito (el usuario puede reintentar)
}
```

## 📊 Beneficios de las Soluciones

1. **✅ Consistencia:** Los códigos de descuento solo se marcan como usados cuando el pago es exitoso
2. **✅ Experiencia de Usuario:** Si el pago falla, el usuario puede reintentar con el mismo código
3. **✅ Trazabilidad:** Se almacena el ID del código de descuento en la orden para auditoría
4. **✅ Robustez:** No hay riesgo de marcar códigos como usados prematuramente
5. **✅ Logging:** Logs detallados para monitoreo y debugging

## 🧪 Scripts de Prueba

### **test-discount-codes-fixed.js**
Script completo para verificar:
- Estructura de la base de datos
- Códigos de descuento existentes
- Flujo completo de checkout con descuento
- Registro correcto de códigos usados
- Restricciones de reuso

### **Uso:**
```bash
# Compilar el proyecto
npm run build

# Ejecutar migraciones
node run-migrations.js

# Ejecutar prueba
node test-discount-codes-fixed.js
```

## 🔧 Comandos para Aplicar las Soluciones

```bash
# 1. Compilar el proyecto
npm run build

# 2. Ejecutar migraciones
node run-migrations.js

# 3. Verificar que todo funciona
node test-discount-codes-fixed.js

# 4. Reiniciar el servidor
npm run start:dev
```

## 📋 Checklist de Verificación

- [ ] ✅ Migración ejecutada correctamente
- [ ] ✅ Columna `discount_code_id` agregada a la tabla `orders`
- [ ] ✅ Códigos de descuento se almacenan en la orden durante el checkout
- [ ] ✅ Códigos de descuento se marcan como usados solo en pago exitoso
- [ ] ✅ Validaciones de reuso funcionando correctamente
- [ ] ✅ Logs detallados para monitoreo
- [ ] ✅ Script de prueba ejecutado exitosamente

## 🎉 Resultado Final

El módulo de discount-codes ahora está **correctamente implementado** y los códigos de descuento se almacenan apropiadamente en la base de datos cuando son utilizados exitosamente, manteniendo la consistencia y evitando problemas de timing.
