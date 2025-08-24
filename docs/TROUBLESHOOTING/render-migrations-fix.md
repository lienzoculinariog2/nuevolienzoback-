# 🔧 Solución de Problemas de Migraciones en Render

## Problema
Los errores que estabas viendo en Render eran causados por tablas faltantes en la base de datos:

1. **`column DiscountCodesUsed.used_at does not exist`** - Falta la columna `used_at` en la tabla `discount_codes_used`
2. **`relation "orders_detail" does not exist`** - Falta la tabla `orders_detail`

## Solución Implementada

### 1. Migraciones Creadas
Se crearon dos nuevas migraciones:

- **`1703123456792-CreateDiscountCodesUsedTable.ts`** - Crea la tabla `discount_codes_used`
- **`1703123456793-CreateOrdersDetailTable.ts`** - Crea la tabla `orders_detail`

### 2. Script de Migraciones para Render
Se creó `render-migrations.js` específicamente para ejecutar migraciones en Render.

## Cómo Ejecutar las Migraciones

### Opción 1: Automático (Recomendado)
Las migraciones se ejecutarán automáticamente en el próximo deploy de Render.

### Opción 2: Manual
Si necesitas ejecutar las migraciones manualmente:

1. **En Render Dashboard:**
   - Ve a tu servicio
   - Abre la consola/terminal
   - Ejecuta: `npm run migrate:render`

2. **O desde tu terminal local:**
   ```bash
   # Conectar a la base de datos de Render
   npm run migrate:render
   ```

## Verificación

Después de ejecutar las migraciones, deberías ver en los logs:

```
📋 Tabla discount_codes_used: ✅ Existe
📋 Tabla orders_detail: ✅ Existe
📋 Tabla products_ingredients: ✅ Existe
📋 Tabla payments: ✅ Existe
```

## Estructura de las Tablas Creadas

### discount_codes_used
```sql
CREATE TABLE discount_codes_used (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE
);
```

### orders_detail
```sql
CREATE TABLE orders_detail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE
);
```

## Prevención de Problemas Futuros

1. **Siempre crear migraciones** cuando agregues nuevas entidades
2. **Probar migraciones localmente** antes de hacer deploy
3. **Verificar que las migraciones se ejecuten** en cada deploy
4. **Revisar logs de Render** después de cada deploy

## Comandos Útiles

```bash
# Generar nueva migración
npm run migration:generate -- src/migrations/NombreMigracion

# Ejecutar migraciones localmente
npm run migrate

# Ejecutar migraciones en Render
npm run migrate:render

# Verificar estado de migraciones
npm run typeorm -- migration:show
```

## Contacto
Si sigues teniendo problemas, revisa los logs de Render y verifica que las tablas se hayan creado correctamente.
