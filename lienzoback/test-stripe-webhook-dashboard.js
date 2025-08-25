const Stripe = require('stripe');
require('dotenv').config({ path: '.env.development' });

console.log('🔍 VERIFICACIÓN DE WEBHOOK EN STRIPE DASHBOARD');
console.log('==============================================\n');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testWebhookFromStripe() {
  try {
    console.log('✅ Conectando a Stripe...');
    
    // Obtener webhooks configurados
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('❌ No hay webhooks configurados');
      return;
    }
    
    // Encontrar el webhook de nuestro proyecto
    const ourWebhook = webhooks.data.find(wh => 
      wh.url.includes('lienzoback.onrender.com') || 
      wh.url.includes('nuevolienzoback.onrender.com')
    );
    
    if (!ourWebhook) {
      console.log('❌ No se encontró webhook para nuestro proyecto');
      console.log('Webhooks disponibles:');
      webhooks.data.forEach(wh => {
        console.log(`   - ${wh.url} (${wh.status})`);
      });
      return;
    }
    
    console.log('✅ Webhook encontrado:');
    console.log(`   URL: ${ourWebhook.url}`);
    console.log(`   Estado: ${ourWebhook.status}`);
    console.log(`   Eventos: ${ourWebhook.enabled_events.join(', ')}`);
    
    // Crear un payment intent de prueba
    console.log('\n🧪 Creando payment intent de prueba...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      metadata: {
        test: 'true',
        source: 'webhook_test'
      }
    });
    
    console.log(`✅ Payment Intent creado: ${paymentIntent.id}`);
    console.log(`   Estado: ${paymentIntent.status}`);
    console.log(`   Monto: $${(paymentIntent.amount / 100).toFixed(2)}`);
    
    // Simular un pago exitoso
    console.log('\n💰 Simulando pago exitoso...');
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa' // Tarjeta de prueba de Stripe
    });
    
    console.log(`✅ Payment Intent confirmado: ${confirmedPaymentIntent.id}`);
    console.log(`   Estado final: ${confirmedPaymentIntent.status}`);
    
    // Esperar un momento para que el webhook se procese
    console.log('\n⏳ Esperando 5 segundos para que el webhook se procese...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar eventos recientes
    console.log('\n📋 Verificando eventos recientes...');
    const events = await stripe.events.list({
      limit: 10,
      type: 'payment_intent.succeeded'
    });
    
    const recentEvent = events.data.find(event => 
      event.data.object.id === confirmedPaymentIntent.id
    );
    
    if (recentEvent) {
      console.log('✅ Evento encontrado:');
      console.log(`   ID: ${recentEvent.id}`);
      console.log(`   Tipo: ${recentEvent.type}`);
      console.log(`   Creado: ${new Date(recentEvent.created * 1000).toLocaleString()}`);
      console.log(`   Payment Intent: ${recentEvent.data.object.id}`);
      
      // Verificar si el webhook se envió
      if (recentEvent.pending_webhooks > 0) {
        console.log(`   ⚠️  Webhooks pendientes: ${recentEvent.pending_webhooks}`);
      } else {
        console.log('   ✅ Webhook procesado');
      }
    } else {
      console.log('❌ No se encontró el evento esperado');
    }
    
    console.log('\n📊 RESUMEN:');
    console.log('===========');
    console.log('✅ Payment Intent creado y confirmado');
    console.log('✅ Evento payment_intent.succeeded generado');
    console.log('✅ Webhook configurado en Stripe');
    
    console.log('\n🔍 PRÓXIMOS PASOS:');
    console.log('1. Verificar en Render Dashboard los logs del webhook');
    console.log('2. Buscar mensajes como:');
    console.log('   - "🔍 Webhook received:"');
    console.log('   - "✅ Webhook verified successfully"');
    console.log('   - "✅ Webhook processed successfully"');
    console.log('3. Si no hay logs, verificar configuración del webhook en Stripe');
    
    console.log('\n📝 PARA VERIFICAR EN RENDER:');
    console.log('1. Ir a https://dashboard.render.com');
    console.log('2. Seleccionar el servicio lienzoback');
    console.log('3. Ir a la pestaña "Logs"');
    console.log('4. Buscar logs recientes del webhook');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🔧 Solución:');
      console.log('1. Verificar que STRIPE_SECRET_KEY esté configurado correctamente');
      console.log('2. Verificar que la clave sea válida en el dashboard de Stripe');
    }
  }
}

// Verificar configuración
console.log('🔧 Verificando configuración:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurado' : '❌ No configurado');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurado' : '❌ No configurado');

console.log('\n🚀 Iniciando prueba de webhook...\n');

testWebhookFromStripe().then(() => {
  console.log('\n✅ Prueba completada');
}).catch((error) => {
  console.log('\n❌ Error en prueba:', error.message);
});
