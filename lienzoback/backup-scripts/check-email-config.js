// Cargar variables de entorno
require('dotenv').config({ path: '.env.development' });

const nodemailer = require('nodemailer');

async function checkEmailConfig() {
  console.log('🔍 ===== VERIFICANDO CONFIGURACIÓN DE EMAIL =====');
  
  // Verificar variables de entorno
  const requiredVars = [
    'NODEMAILER_HOST',
    'NODEMAILER_PORT',
    'NODEMAILER_SECURE', 
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];
  
  console.log('\n📋 Variables de entorno:');
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: NO CONFIGURADO`);
    } else {
      const value = varName.includes('PASSWORD') ? '***CONFIGURADO***' : process.env[varName];
      console.log(`✅ ${varName}: ${value}`);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Variables faltantes: ${missingVars.join(', ')}`);
    console.log('💡 Configura estas variables en tu entorno de producción');
    return;
  }
  
  // Crear transporter
  console.log('\n📧 Configurando Nodemailer...');
  const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: parseInt(process.env.NODEMAILER_PORT),
    secure: process.env.NODEMAILER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Configuración adicional para debugging
    debug: true,
    logger: true
  });
  
  // Verificar conexión
  console.log('🔗 Probando conexión SMTP...');
  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');
  } catch (error) {
    console.log('❌ Error en conexión SMTP:', error.message);
    console.log('💡 Verifica:');
    console.log('   - Credenciales correctas');
    console.log('   - Host y puerto correctos');
    console.log('   - Configuración de seguridad (SSL/TLS)');
    console.log('   - Firewall/restricciones de red');
    return;
  }
  
  // Probar envío de email de prueba
  console.log('\n📤 Probando envío de email...');
  try {
    const testEmail = {
      from: `"Lienzo Culinario" <${process.env.EMAIL_USER}>`,
      to: 'kaxoko2120@namestal.com', // Enviar a la dirección especificada
      subject: 'Prueba de Registro de Usuarios - Lienzo Culinario',
      html: `
        <h2>✅ Configuración de email exitosa</h2>
        <p>Este es un email de prueba para verificar que la configuración de email está funcionando correctamente.</p>
        <p><strong>Host:</strong> ${process.env.NODEMAILER_HOST}</p>
        <p><strong>Puerto:</strong> ${process.env.NODEMAILER_PORT}</p>
        <p><strong>Seguro:</strong> ${process.env.NODEMAILER_SECURE}</p>
        <p><strong>Usuario:</strong> ${process.env.EMAIL_USER}</p>
        <hr>
        <p><em>Enviado desde Lienzo Culinario Backend</em></p>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email de prueba enviado exitosamente');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📧 Destinatario: ${process.env.EMAIL_USER}`);
    
  } catch (error) {
    console.log('❌ Error enviando email de prueba:', error.message);
    console.log('💡 Verifica la configuración SMTP');
  }
  
  console.log('\n✅ ===== VERIFICACIÓN COMPLETADA =====');
}

// Ejecutar verificación
checkEmailConfig().catch(console.error);
