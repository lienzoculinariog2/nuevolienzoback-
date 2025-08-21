const https = require('https');
const http = require('http');

const BASE_URL = 'https://nuevolienzoback.onrender.com';

async function testCORS() {
  console.log('🔧 Probando configuración de CORS...\n');

  const testOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:4200',
    'https://example.com', // Para probar que se bloquea
  ];

  for (const origin of testOrigins) {
    try {
      const result = await makeCORSRequest(origin);
      console.log(`✅ ${origin}: ${result ? 'PERMITIDO' : 'BLOQUEADO'}`);
    } catch (error) {
      console.log(`❌ ${origin}: ERROR - ${error.message}`);
    }
  }
}

function makeCORSRequest(origin) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nuevolienzoback.onrender.com',
      port: 443,
      path: '/file/test/health',
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    };

    const req = https.request(options, (res) => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers'],
        'Access-Control-Allow-Credentials': res.headers['access-control-allow-credentials'],
      };

      console.log(`   Headers:`, corsHeaders);
      
      // Verificar si el origen está permitido
      const isAllowed = corsHeaders['Access-Control-Allow-Origin'] === origin || 
                       corsHeaders['Access-Control-Allow-Origin'] === '*';
      
      resolve(isAllowed);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Ejecutar la prueba
testCORS();
