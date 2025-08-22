# 📋 Estandarización de Nombres de Entidades

## 🎯 **Objetivo**
Estandarizar todos los nombres de entidades en la base de datos a **minúsculas** para mantener consistencia en el proyecto.

## 📊 **Cambios Realizados**

### **✅ Entidades Actualizadas:**

| **Entidad** | **Nombre Anterior** | **Nombre Nuevo** | **Estado** |
|-------------|---------------------|------------------|------------|
| `Products` | `PRODUCTOS` | `productos` | ✅ **Actualizado** |
| `Categories` | `CATEGORIES` | `categories` | ✅ **Actualizado** |
| `Reviews` | `REVIEWS` | `reviews` | ✅ **Actualizado** |
| `Ingredients` | `INGREDIENTS` | `ingredients` | ✅ **Actualizado** |
| `Products-Ingredients` | `PRODUCTS_INGREDIENTS` | `products_ingredients` | ✅ **Actualizado** |

### **✅ Entidades Ya Estandarizadas:**

| **Entidad** | **Nombre en BD** | **Estado** |
|-------------|------------------|------------|
| `Orders` | `orders` | ✅ **Ya estandarizado** |
| `OrderDetail` | `orders_detail` | ✅ **Ya estandarizado** |
| `Users` | `users` | ✅ **Ya estandarizado** |
| `Cart` | `carts` | ✅ **Ya estandarizado** |
| `CartItem` | `cart_items` | ✅ **Ya estandarizado** |
| `DiscountCodes` | `discount_codes` | ✅ **Ya estandarizado** |
| `DiscountCodesUsed` | `discount_codes_used` | ✅ **Ya estandarizado** |

## 🔧 **Archivos Modificados**

### **Entidades:**
- `src/modules/products/entities/product.entity.ts`
- `src/modules/categories/entities/category.entity.ts`
- `src/modules/product-review/entities/review.entity.ts`
- `src/modules/ingredients/entities/ingredient.entity.ts`

### **Migración:**
- `src/migrations/1703123456790-RenameTablesToLowerCase.ts`

## 🚀 **Implementación**

### **1. Cambios en Código:**
```typescript
// Antes
@Entity('PRODUCTOS')
@Entity({ name: 'CATEGORIES' })
@Entity({ name: 'REVIEWS' })
@Entity('INGREDIENTS')

// Después
@Entity('productos')
@Entity({ name: 'categories' })
@Entity({ name: 'reviews' })
@Entity('ingredients')
```

### **2. Migración de Base de Datos:**
```sql
-- Ejecutar en producción
ALTER TABLE "PRODUCTOS" RENAME TO "productos";
ALTER TABLE "CATEGORIES" RENAME TO "categories";
ALTER TABLE "REVIEWS" RENAME TO "reviews";
ALTER TABLE "INGREDIENTS" RENAME TO "ingredients";
ALTER TABLE "PRODUCTS_INGREDIENTS" RENAME TO "products_ingredients";
```

## 📋 **Pasos para Implementar**

### **Desarrollo:**
1. ✅ Código actualizado
2. ✅ Build exitoso
3. ✅ Migración creada

### **Producción:**
1. **Ejecutar migración** en base de datos
2. **Verificar** que todas las tablas se renombren correctamente
3. **Probar** funcionalidad de la aplicación
4. **Monitorear** logs por posibles errores

## ⚠️ **Consideraciones Importantes**

### **Antes del Deploy:**
- **Backup** de la base de datos
- **Verificar** que no hay queries hardcodeados con nombres antiguos
- **Probar** en ambiente de staging

### **Durante el Deploy:**
- **Downtime mínimo** requerido para renombrar tablas
- **Verificar** integridad de foreign keys
- **Monitorear** logs de aplicación

### **Después del Deploy:**
- **Verificar** funcionalidad de todos los endpoints
- **Comprobar** que las relaciones funcionan correctamente
- **Validar** que no hay errores en logs

## 🎉 **Beneficios**

1. **Consistencia**: Todos los nombres siguen el mismo patrón
2. **Mantenibilidad**: Código más fácil de mantener
3. **Legibilidad**: Nombres más claros y consistentes
4. **Estándares**: Cumple con convenciones de PostgreSQL
5. **Escalabilidad**: Facilita futuras modificaciones

## 📝 **Notas del Equipo**

- **Fecha**: 21 de Agosto, 2025
- **Responsable**: Equipo de desarrollo
- **Revisión**: Pendiente de revisión por el equipo
- **Estado**: Listo para implementación en producción
