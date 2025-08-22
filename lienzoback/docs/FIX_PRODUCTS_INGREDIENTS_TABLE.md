# 🔧 Solución: Error "relation products_ingredients does not exist"

## 🚨 **Problema**
```
driverError: error: relation "products_ingredients" does not exist
```

## 📋 **Causa**
La tabla de relación many-to-many entre `products` e `ingredients` no se creó en la base de datos de Render durante el deploy.

## 🛠️ **Soluciones Disponibles**

### **Opción 1: Habilitar sincronización temporal (RECOMENDADA)**

#### **En Render Dashboard:**
1. Ir a **Environment Variables**
2. Agregar/modificar:
   ```
   TYPEORM_SYNC=true
   TYPEORM_DROP=false
   ```
3. **Redeploy** la aplicación
4. Una vez que funcione, cambiar de vuelta a:
   ```
   TYPEORM_SYNC=false
   TYPEORM_DROP=false
   ```

### **Opción 2: Ejecutar migración de TypeORM**

#### **En Render Dashboard:**
1. Habilitar sincronización temporal:
   ```
   TYPEORM_SYNC=true
   TYPEORM_DROP=false
   ```
2. **Redeploy** la aplicación
3. Una vez que funcione, deshabilitar sincronización:
   ```
   TYPEORM_SYNC=false
   TYPEORM_DROP=false
   ```

## 📊 **Verificación**

### **Comprobar que la tabla existe:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'products_ingredients';
```

### **Verificar estructura:**
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products_ingredients'
ORDER BY ordinal_position;
```

### **Verificar foreign keys:**
```sql
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products_ingredients';
```

## 🎯 **Prevención Futura**

### **1. Verificar migraciones antes del deploy:**
```bash
# Localmente
npm run typeorm:run-migrations
```

### **2. Usar migraciones en lugar de synchronize:**
- Mantener `TYPEORM_SYNC=false` en producción
- Crear migraciones para cambios de esquema
- Ejecutar migraciones manualmente en producción

### **3. Script de verificación:**
```sql
-- Verificar que todas las tablas necesarias existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'products', 'categories', 'ingredients', 
    'reviews', 'orders', 'orders_detail', 'carts', 
    'cart_items', 'payments', 'discount_codes', 
    'discount_codes_used', 'products_ingredients'
  )
ORDER BY table_name;
```

## 📝 **Notas Importantes**

- **Backup obligatorio** antes de cualquier cambio en producción
- **Probar en staging** antes de aplicar en producción
- **Monitorear logs** después de aplicar la solución
- **Verificar funcionalidad** de productos e ingredientes

## ✅ **Estado de la Solución**

- [x] Migración creada: `1703123456791-CreateProductsIngredientsTable.ts`
- [x] Documentación completa
- [ ] Aplicar en Render (pendiente)
