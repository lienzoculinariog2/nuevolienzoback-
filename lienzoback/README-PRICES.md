# 🏷️ Manejo de Precios en el Sistema

## 💰 **Formato de Precios**

### **Todos los precios se manejan en DÓLARES**

- **Base de datos**: Almacena precios en dólares
- **JSON de productos**: Precios en dólares
- **Cálculos internos**: Trabajan con dólares
- **Stripe**: Recibe centavos (conversión automática)

### **Ejemplos de precios:**

| Dólares | Descripción |
|---------|-------------|
| $7.50   | Salmón al Horno |
| $6.00   | Ensalada Keto |
| $4.90   | Bowl de Quinoa |
| $8.90   | Filete de Res |
| $6.80   | Pollo Thai |

## 🔄 **Flujo de Precios**

### **1. Creación de Producto:**
```typescript
// Frontend envía precio en dólares
{
  "price": 7.50  // $7.50
}

// Base de datos almacena
price: 7.50
```

### **2. Cálculo de Totales:**
```typescript
// Cálculo directo (en dólares)
const total = cart.items.reduce((sum, item) => 
  sum + item.product.price * item.quantity, 0
);
// total = 7.50 * 2 = 15.00 dólares
```

### **3. Pago con Stripe:**
```typescript
// Conversión automática a centavos para Stripe
const paymentIntent = await this.stripe.paymentIntents.create({
  amount: Math.round(15.00 * 100),  // 1500 centavos
  currency: 'usd'
});
```

## 📋 **Ventajas de usar dólares:**

1. ✅ **Intuitivo**: Más fácil de entender y trabajar
2. ✅ **Frontend**: No necesita conversiones
3. ✅ **Base de datos**: Almacena valores legibles
4. ✅ **Stripe**: Conversión automática a centavos

## 🚨 **Importante:**

- **Sistema trabaja** en dólares internamente
- **Stripe recibe** conversión automática a centavos
- **Frontend envía** precios en dólares
- **Cálculos** se hacen en dólares
