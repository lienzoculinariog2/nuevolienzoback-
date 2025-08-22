-- Script para crear la tabla products_ingredients en Render
-- Ejecutar este script en la base de datos de Render si la migración no funciona

-- Crear tabla de relación many-to-many entre products e ingredients
CREATE TABLE IF NOT EXISTS "products_ingredients" (
  "products_id" uuid NOT NULL,
  "ingredients_id" uuid NOT NULL,
  CONSTRAINT "PK_products_ingredients" PRIMARY KEY ("products_id", "ingredients_id")
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_products_id" 
ON "products_ingredients" ("products_id");

CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_ingredients_id" 
ON "products_ingredients" ("ingredients_id");

-- Agregar foreign keys (solo si las tablas referenciadas existen)
DO $$
BEGIN
  -- Verificar si la tabla products existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE "products_ingredients" 
    ADD CONSTRAINT "FK_products_ingredients_products_id" 
    FOREIGN KEY ("products_id") REFERENCES "products"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- Verificar si la tabla ingredients existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredients') THEN
    ALTER TABLE "products_ingredients" 
    ADD CONSTRAINT "FK_products_ingredients_ingredients_id" 
    FOREIGN KEY ("ingredients_id") REFERENCES "ingredients"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products_ingredients'
ORDER BY ordinal_position;
