const Stripe = require('stripe');
require('dotenv').config({ path: '.env.development' });

console.log('🔍 VERIFICACIÓN DE WEBHOOK EN STRIPE DASHBOARD');
console.log('==============================================\n');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyWebhookConfiguration() {
  try {
    console.log('✅ Conectando a Stripe...');
    
    // Obtener lista de webhooks
    const webhooks = await stripe.webhookEndpoints.list();
    
    console.log(`📊 Webhooks encontrados: ${webhooks.data.length}`);
    
    if (webhooks.data.length === 0) {
      console.log('❌ No hay webhooks configurados');
      console.log('\n🔧 Para crear un webhook:');
      console.log('1. Ve a https://dashboard.stripe.com/webhooks');
      console.log('2. Click en "Add endpoint"');
      console.log('3. URL: https://lienzoback.onrender.com/payments/webhook');
      console.log('4. Eventos: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded');
      console.log('5. Copia el webhook secret y agrégalo a las variables de entorno');
      return;
    }
    
    // Verificar cada webhook
    webhooks.data.forEach((webhook, index) => {
      console.log(`\n🔗 Webhook ${index + 1}:`);
      console.log(`   ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Estado: ${webhook.status}`);
      console.log(`   Eventos: ${webhook.enabled_events.join(', ')}`);
      console.log(`   Creado: ${new Date(webhook.created * 1000).toLocaleString()}`);
      
      // Verificar si es el webhook correcto
      if (webhook.url.includes('lienzoback.onrender.com')) {
        console.log('   ✅ URL correcta para nuestro proyecto');
      } else {
        console.log('   ⚠️  URL diferente a nuestro proyecto');
      }
      
      if (webhook.status === 'enabled') {
        console.log('   ✅ Webhook activo');
      } else {
        console.log('   ❌ Webhook inactivo');
      }
      
      // Verificar eventos necesarios
      const requiredEvents = ['payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.refunded'];
      const missingEvents = requiredEvents.filter(event => !webhook.enabled_events.includes(event));
      
      if (missingEvents.length === 0) {
        console.log('   ✅ Todos los eventos necesarios están configurados');
      } else {
        console.log(`   ⚠️  Eventos faltantes: ${missingEvents.join(', ')}`);
      }
    });
    
    // Verificar eventos recientes
    console.log('\n📋 Eventos recientes:');
    try {
      const events = await stripe.events.list({ limit: 5 });
      
      if (events.data.length === 0) {
        console.log('   No hay eventos recientes');
      } else {
        events.data.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.type} - ${event.created ? new Date(event.created * 1000).toLocaleString() : 'N/A'}`);
          if (event.data?.object?.id) {
            console.log(`      ID: ${event.data.object.id}`);
          }
        });
      }
    } catch (error) {
      console.log('   ❌ Error al obtener eventos:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error al verificar webhooks:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🔧 Solución:');
      console.log('1. Verificar que STRIPE_SECRET_KEY esté configurado correctamente');
      console.log('2. Verificar que la clave sea válida en el dashboard de Stripe');
    }
  }
}

// Verificar variables de entorno
console.log('🔧 Verificando configuración:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurado' : '❌ No configurado');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurado' : '❌ No configurado');
console.log('URL de producción:', 'https://lienzoback.onrender.com');

console.log('\n🚀 Ejecutando verificación...\n');

verifyWebhookConfiguration().then(() => {
  console.log('\n✅ Verificación completada');
}).catch((error) => {
  console.log('\n❌ Error en verificación:', error.message);
});
