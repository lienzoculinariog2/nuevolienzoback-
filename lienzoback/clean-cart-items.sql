-- Script para limpiar cart items inconsistentes
-- Eliminar cart items que no tienen producto asociado

-- Verificar cart items inconsistentes
SELECT 
    ci.id as cart_item_id,
    ci.product_id,
    ci.cart_id,
    p.id as product_exists
FROM cart_items ci
LEFT JOIN products p ON ci.product_id = p.id
WHERE ci.product_id IS NULL OR p.id IS NULL;

-- Eliminar cart items inconsistentes
DELETE FROM cart_items 
WHERE product_id IS NULL 
   OR product_id NOT IN (SELECT id FROM products);

-- Verificar que se limpiaron
SELECT COUNT(*) as remaining_cart_items FROM cart_items;
