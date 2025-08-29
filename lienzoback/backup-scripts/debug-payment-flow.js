const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function debugPaymentFlow() {
  console.log('🔍 ===== DEBUGGEANDO FLUJO DE PAGOS =====');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando que el servidor esté funcionando...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      console.log(`✅ Servidor funcionando: ${productsResponse.status} - Productos obtenidos`);
    } catch (error) {
      console.log(`❌ Servidor no responde: ${error.message}`);
      return;
    }
    console.log('');

    // 2. Verificar productos disponibles
    console.log('2️⃣ Verificando productos disponibles...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      const products = productsResponse.data;
      console.log(`✅ Encontrados ${products.length} productos`);
      
      if (products.length > 0) {
        const product = products[0];
        console.log(`📦 Producto ejemplo: ${product.name} - Stock: ${product.stock} - Precio: $${product.price}`);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo productos: ${error.message}`);
    }
    console.log('');

    // 3. Verificar carritos activos
    console.log('3️⃣ Verificando carritos activos...');
    try {
      const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
      const carts = cartsResponse.data;
      console.log(`✅ Encontrados ${carts.length} carritos activos`);
      
      if (carts.length > 0) {
        const cart = carts[0];
        console.log(`🛒 Carrito ejemplo: ID ${cart.id} - Usuario: ${cart.user?.id} - Items: ${cart.items?.length || 0}`);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo carritos: ${error.message}`);
    }
    console.log('');

    // 4. Verificar órdenes
    console.log('4️⃣ Verificando órdenes...');
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/orders`);
      const orders = ordersResponse.data;
      console.log(`✅ Encontradas ${orders.length} órdenes`);
      
      if (orders.length > 0) {
        const order = orders[0];
        console.log(`📋 Orden ejemplo: ID ${order.id} - Estado: ${order.status} - Total: $${order.totalAmount}`);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo órdenes: ${error.message}`);
    }
    console.log('');

    // 5. Verificar pagos
    console.log('5️⃣ Verificando pagos...');
    try {
      const paymentsResponse = await axios.get(`${BASE_URL}/payments`);
      const payments = paymentsResponse.data;
      console.log(`✅ Encontrados ${payments.length} pagos`);
      
      if (payments.length > 0) {
        const payment = payments[0];
        console.log(`💳 Pago ejemplo: ID ${payment.id} - Estado: ${payment.status} - Amount: $${payment.amount}`);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo pagos: ${error.message}`);
    }
    console.log('');

    // 6. Verificar webhook endpoint
    console.log('6️⃣ Verificando endpoint de webhook...');
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/payments/webhook`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid-signature'
        }
      });
      console.log(`✅ Endpoint de webhook responde: ${webhookResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ Endpoint de webhook responde (error esperado por firma inválida): ${error.response.status}`);
      } else {
        console.log(`❌ Error en endpoint de webhook: ${error.message}`);
      }
    }
    console.log('');

    console.log('✅ ===== DEBUG COMPLETADO =====');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar debug
debugPaymentFlow().catch(console.error);
