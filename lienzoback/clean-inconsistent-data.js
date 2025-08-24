const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function cleanInconsistentData() {
  console.log('🧹 Limpiando datos inconsistentes...');
  console.log('====================================\n');

  try {
    // 1. Obtener todos los cart items
    console.log('🔍 Obteniendo cart items...');
    const cartItemsResponse = await axios.get(`${BASE_URL}/cart/active`);
    const cartItems = cartItemsResponse.data;
    console.log(`✅ Encontrados ${cartItems.length} cart items activos`);

    // 2. Verificar cada cart item
    let inconsistentItems = [];
    for (const item of cartItems) {
      if (!item.product || !item.product.id) {
        inconsistentItems.push(item);
        console.log(`❌ Cart item ${item.id} sin producto asociado`);
      }
    }

    if (inconsistentItems.length === 0) {
      console.log('✅ No se encontraron datos inconsistentes');
      return;
    }

    console.log(`\n🔧 Encontrados ${inconsistentItems.length} items inconsistentes`);
    console.log('Eliminando items inconsistentes...');

    // 3. Eliminar items inconsistentes
    for (const item of inconsistentItems) {
      try {
        await axios.delete(`${BASE_URL}/cart/${item.cart.user.id}/${item.id}`);
        console.log(`✅ Eliminado cart item ${item.id}`);
      } catch (error) {
        console.log(`❌ Error eliminando cart item ${item.id}: ${error.message}`);
      }
    }

    console.log('\n🎯 Limpieza completada');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  }
}

// Ejecutar limpieza
cleanInconsistentData().catch(console.error);
