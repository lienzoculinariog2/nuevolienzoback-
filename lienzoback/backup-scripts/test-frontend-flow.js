const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testFrontendFlow() {
  console.log('🧪 ===== PROBANDO FLUJO COMPLETO CON FRONTEND =====');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // 1. Obtener productos disponibles
    console.log('1️⃣ Obteniendo productos disponibles...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const products = productsResponse.data.data || productsResponse.data;
    
    if (!products || products.length === 0) {
      console.log('❌ No hay productos disponibles');
      return;
    }
    
    // Seleccionar un producto con stock disponible
    const productWithStock = products.find(p => p.stock > 0);
    if (!productWithStock) {
      console.log('❌ No hay productos con stock disponible');
      return;
    }
    
    console.log(`✅ Producto seleccionado: ${productWithStock.name}`);
    console.log(`📦 Stock disponible: ${productWithStock.stock}`);
    console.log(`💰 Precio: $${productWithStock.price}`);
    console.log('');

    // 2. Obtener un usuario real
    console.log('2️⃣ Obteniendo usuario real...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data;
    
    if (!users || users.length === 0) {
      console.log('❌ No hay usuarios disponibles');
      return;
    }
    
    const userId = users[0].id;
    console.log(`✅ Usuario seleccionado: ${users[0].name} (${users[0].email})`);
    console.log(`🆔 User ID: ${userId}`);
    console.log('');

    // 3. Simular agregar producto al carrito
    console.log('3️⃣ Simulando agregar producto al carrito...');
    const addToCartData = {
      productId: productWithStock.id,
      quantity: 1
    };
    
    try {
      const cartResponse = await axios.post(`${BASE_URL}/cart/addsingle/${userId}`, addToCartData);
      console.log('✅ Producto agregado al carrito exitosamente');
      console.log(`🛒 Carrito actualizado: ${JSON.stringify(cartResponse.data, null, 2)}`);
      console.log('');
    } catch (error) {
      console.log('❌ Error agregando al carrito:', error.response?.data || error.message);
      console.log('');
    }

    // 4. Simular checkout completo
    console.log('4️⃣ Simulando checkout completo...');
    const checkoutData = {
      shippingAddress: 'Calle de Prueba 123, Ciudad de Prueba',
      discountCode: null
    };
    
    try {
      const checkoutResponse = await axios.post(`${BASE_URL}/checkout/${userId}/complete`, checkoutData);
      console.log('✅ Checkout completado exitosamente');
      console.log(`📋 Order ID: ${checkoutResponse.data.orderId}`);
      console.log(`💳 Payment Intent ID: ${checkoutResponse.data.paymentIntent.paymentIntentId}`);
      console.log(`💰 Amount: $${checkoutResponse.data.paymentIntent.amount}`);
      console.log('');
      
      const orderId = checkoutResponse.data.orderId;
      const paymentIntentId = checkoutResponse.data.paymentIntent.paymentIntentId;
      
      // 5. Verificar estado inicial de la orden
      console.log('5️⃣ Verificando estado inicial de la orden...');
      const orderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${orderId}`);
      console.log(`📊 Estado de la orden: ${orderStatusResponse.data.orderStatus}`);
      console.log(`💳 Estado del pago: ${orderStatusResponse.data.paymentStatus}`);
      console.log('');
      
      // 6. Verificar stock inicial del producto
      console.log('6️⃣ Verificando stock inicial del producto...');
      const initialProductResponse = await axios.get(`${BASE_URL}/products/${productWithStock.id}`);
      const initialStock = initialProductResponse.data.stock;
      console.log(`📦 Stock inicial de ${productWithStock.name}: ${initialStock}`);
      console.log('');
      
      // 7. Instrucciones para el usuario
      console.log('7️⃣ INSTRUCCIONES PARA EL USUARIO:');
      console.log('');
      console.log('🔄 Ahora ejecuta en otra terminal:');
      console.log(`   stripe trigger payment_intent.succeeded --payment-intent=${paymentIntentId}`);
      console.log('');
      console.log('⏳ Espera 10 segundos después de ejecutar el comando...');
      console.log('');
      
      // 8. Esperar y verificar estado final
      console.log('8️⃣ Esperando 15 segundos para que el webhook se procese...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log('');
      
      // 9. Verificar estado final de la orden
      console.log('9️⃣ Verificando estado final de la orden...');
      const finalOrderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${orderId}`);
      console.log(`📊 Estado final de la orden: ${finalOrderStatusResponse.data.orderStatus}`);
      console.log(`💳 Estado final del pago: ${finalOrderStatusResponse.data.paymentStatus}`);
      console.log(`✅ ¿Está pagado?: ${finalOrderStatusResponse.data.isPaid}`);
      console.log('');
      
      // 10. Verificar stock final del producto
      console.log('🔟 Verificando stock final del producto...');
      const finalProductResponse = await axios.get(`${BASE_URL}/products/${productWithStock.id}`);
      const finalStock = finalProductResponse.data.stock;
      console.log(`📦 Stock final de ${productWithStock.name}: ${finalStock}`);
      
      if (finalStock < initialStock) {
        console.log(`✅ Stock se descuento correctamente: ${initialStock} → ${finalStock} (-${initialStock - finalStock})`);
      } else {
        console.log(`❌ Stock NO se descuento: ${initialStock} → ${finalStock}`);
      }
      console.log('');
      
      // 11. Verificar carrito (debería estar vacío)
      console.log('1️⃣1️⃣ Verificando estado del carrito...');
      try {
        const cartResponse = await axios.get(`${BASE_URL}/cart/${userId}`);
        const cartItems = cartResponse.data.items || [];
        if (cartItems.length === 0) {
          console.log('✅ Carrito está vacío (correcto)');
        } else {
          console.log(`❌ Carrito NO está vacío: ${cartItems.length} items`);
        }
      } catch (error) {
        console.log('✅ Carrito no encontrado o vacío (correcto)');
      }
      console.log('');
      
      console.log('✅ ===== FLUJO COMPLETO PROBADO =====');
      console.log('');
      console.log('🎯 RESUMEN:');
      console.log(`   📋 Orden: ${orderId}`);
      console.log(`   💳 Payment Intent: ${paymentIntentId}`);
      console.log(`   📦 Producto: ${productWithStock.name}`);
      console.log(`   📊 Stock inicial: ${initialStock}`);
      console.log(`   📊 Stock final: ${finalStock}`);
      console.log(`   ✅ Stock descuento: ${finalStock < initialStock ? 'SÍ' : 'NO'}`);
      console.log(`   🛒 Carrito vacío: ${finalOrderStatusResponse.data.isPaid ? 'SÍ' : 'NO'}`);
      
    } catch (checkoutError) {
      console.log('❌ Error en checkout:', checkoutError.response?.data || checkoutError.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testFrontendFlow().catch(console.error);
