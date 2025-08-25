const axios = require('axios');

console.log('🔍 VERIFICACIÓN DE ESTADO DEL SERVIDOR');
console.log('=======================================\n');

const RENDER_URL = 'https://lienzoback.onrender.com';

async function checkServerStatus() {
  console.log('🚀 Verificando estado del servidor...\n');
  
  const endpoints = [
    { path: '/', name: 'Root', method: 'GET' },
    { path: '/health', name: 'Health', method: 'GET' },
    { path: '/api', name: 'API', method: 'GET' },
    { path: '/payments/webhook', name: 'Webhook', method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Probando ${endpoint.name} (${endpoint.path})...`);
      
      const config = {
        method: endpoint.method,
        url: `${RENDER_URL}${endpoint.path}`,
        timeout: 10000,
        validateStatus: () => true
      };
      
      if (endpoint.method === 'POST') {
        config.data = { test: true };
        config.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log(`   ✅ ${endpoint.name} responde correctamente`);
        if (response.data) {
          console.log(`   📄 Respuesta: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      } else if (response.status === 404) {
        console.log(`   ⚠️  ${endpoint.name} no encontrado (puede ser normal)`);
      } else if (response.status === 400) {
        console.log(`   ⚠️  ${endpoint.name} responde con error 400 (esperado para webhook sin firma)`);
      } else {
        console.log(`   ⚠️  ${endpoint.name} responde con status ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ${endpoint.name}: Conexión rechazada - servidor no disponible`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ ${endpoint.name}: URL no encontrada - problema de DNS`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ ${endpoint.name}: Timeout - servidor no responde`);
      } else {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  // Verificar conectividad básica
  console.log('🌐 Verificando conectividad básica...');
  try {
    const pingResponse = await axios.get(`${RENDER_URL}`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`   Status: ${pingResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(pingResponse.headers, null, 2)}`);
    
    if (pingResponse.headers['x-render-routing']) {
      console.log(`   ⚠️  Render routing: ${pingResponse.headers['x-render-routing']}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error de conectividad: ${error.message}`);
  }
}

async function main() {
  await checkServerStatus();
  
  console.log('📊 DIAGNÓSTICO:');
  console.log('==============');
  console.log('Si todos los endpoints fallan:');
  console.log('1. El servidor no está funcionando');
  console.log('2. Hay un error en el startup');
  console.log('3. Problema de configuración en Render');
  
  console.log('\n🔧 ACCIONES RECOMENDADAS:');
  console.log('1. Verificar en Render Dashboard:');
  console.log('   - Estado del servicio (Running/Stopped)');
  console.log('   - Logs de runtime');
  console.log('   - Configuración de Build & Deploy');
  
  console.log('\n2. Verificar configuración:');
  console.log('   - Script de start (debe ser npm run start:prod)');
  console.log('   - Variables de entorno');
  console.log('   - Puerto configurado');
  
  console.log('\n3. Posibles soluciones:');
  console.log('   - Reiniciar el servicio en Render');
  console.log('   - Verificar logs de build');
  console.log('   - Corregir configuración si es necesario');
}

main().catch(console.error);
