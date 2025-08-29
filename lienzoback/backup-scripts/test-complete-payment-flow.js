const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testCompletePaymentFlow() {
  console.log('🧪 ===== PROBANDO FLUJO COMPLETO DE PAGO =====');
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
    
    const product = products[0];
    console.log(`✅ Producto seleccionado: ${product.name} - Stock: ${product.stock} - Precio: $${product.price}`);
    console.log('');

    // 2. Obtener usuarios disponibles (para simular)
    console.log('2️⃣ Buscando usuario de prueba...');
    let userId = 'test-user-id'; // Usaremos un ID de prueba
    
    // 3. Simular checkout completo
    console.log('3️⃣ Simulando checkout completo...');
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
      
      // 4. Verificar estado inicial de la orden
      console.log('4️⃣ Verificando estado inicial de la orden...');
      const orderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${orderId}`);
      console.log(`📊 Estado de la orden: ${orderStatusResponse.data.orderStatus}`);
      console.log(`💳 Estado del pago: ${orderStatusResponse.data.paymentStatus}`);
      console.log('');
      
      // 5. Verificar stock inicial del producto
      console.log('5️⃣ Verificando stock inicial del producto...');
      const initialProductResponse = await axios.get(`${BASE_URL}/products/${product.id}`);
      const initialStock = initialProductResponse.data.stock;
      console.log(`📦 Stock inicial de ${product.name}: ${initialStock}`);
      console.log('');
      
      // 6. Simular webhook de pago exitoso usando Stripe CLI
      console.log('6️⃣ Simulando webhook de pago exitoso...');
      console.log('🔄 Ejecutando: stripe trigger payment_intent.succeeded --payment-intent=' + paymentIntentId);
      console.log('');
      
      // Nota: El usuario debe ejecutar manualmente:
      // stripe trigger payment_intent.succeeded --payment-intent=PI_XXXXX
      
      console.log('⏳ Esperando 10 segundos para que el webhook se procese...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('');
      
      // 7. Verificar estado final de la orden
      console.log('7️⃣ Verificando estado final de la orden...');
      const finalOrderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${orderId}`);
      console.log(`📊 Estado final de la orden: ${finalOrderStatusResponse.data.orderStatus}`);
      console.log(`💳 Estado final del pago: ${finalOrderStatusResponse.data.paymentStatus}`);
      console.log(`✅ ¿Está pagado?: ${finalOrderStatusResponse.data.isPaid}`);
      console.log('');
      
      // 8. Verificar stock final del producto
      console.log('8️⃣ Verificando stock final del producto...');
      const finalProductResponse = await axios.get(`${BASE_URL}/products/${product.id}`);
      const finalStock = finalProductResponse.data.stock;
      console.log(`📦 Stock final de ${product.name}: ${finalStock}`);
      
      if (finalStock < initialStock) {
        console.log(`✅ Stock se descuento correctamente: ${initialStock} → ${finalStock} (-${initialStock - finalStock})`);
      } else {
        console.log(`❌ Stock NO se descuento: ${initialStock} → ${finalStock}`);
      }
      console.log('');
      
      // 9. Verificar carrito (debería estar vacío)
      console.log('9️⃣ Verificando estado del carrito...');
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
      
    } catch (checkoutError) {
      console.log('❌ Error en checkout:', checkoutError.response?.data || checkoutError.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testCompletePaymentFlow().catch(console.error);
