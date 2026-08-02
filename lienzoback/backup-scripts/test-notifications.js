const { DataSource } = require('typeorm');
const { Users } = require('./dist/modules/users/entities/user.entity');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lienzoback',
  entities: [Users],
  synchronize: false,
  logging: true,
});

async function testNotifications() {
  try {
    console.log('🔍 ===== DIAGNÓSTICO DEL MÓDULO DE NOTIFICACIONES =====');
    
    // 1. Verificar variables de entorno
    console.log('\n📋 Verificando variables de entorno...');
    const requiredEnvVars = [
      'NODEMAILER_HOST',
      'NODEMAILER_PORT', 
      'NODEMAILER_SECURE',
      'EMAIL_USER',
      'EMAIL_PASSWORD'
    ];
    
    const missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
        console.log(`❌ ${varName}: NO CONFIGURADO`);
      } else {
        console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? 'CONFIGURADO' : process.env[varName]}`);
      }
    });
    
    if (missingVars.length > 0) {
      console.log(`\n❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
      console.log('💡 Agrega estas variables a tu archivo .env.development');
      return;
    }

    // 2. Verificar configuración de Nodemailer
    console.log('\n📧 Verificando configuración de Nodemailer...');
    const transporter = nodemailer.createTransporter({
      host: process.env.NODEMAILER_HOST,
      port: parseInt(process.env.NODEMAILER_PORT),
      secure: process.env.NODEMAILER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 3. Verificar conexión SMTP
    console.log('🔗 Probando conexión SMTP...');
    try {
      await transporter.verify();
      console.log('✅ Conexión SMTP exitosa');
    } catch (smtpError) {
      console.log('❌ Error en conexión SMTP:', smtpError.message);
      console.log('💡 Verifica las credenciales y configuración del servidor SMTP');
      return;
    }

    // 4. Verificar plantillas de email
    console.log('\n📄 Verificando plantillas de email...');
    const templatesDir = path.join(__dirname, 'src', 'modules', 'notifications', 'templates');
    const expectedTemplates = [
      'signUp-confirmation.hbs',
      'purchase-confirmation.hbs', 
      'weekly-newsletter.hbs'
    ];
    
    expectedTemplates.forEach(template => {
      const templatePath = path.join(templatesDir, template);
      if (fs.existsSync(templatePath)) {
        console.log(`✅ ${template}: Encontrado`);
      } else {
        console.log(`❌ ${template}: NO ENCONTRADO`);
      }
    });

    // 5. Verificar configuración de rutas de plantillas
    console.log('\n📁 Verificando rutas de plantillas...');
    const configuredTemplatePath = path.resolve(
      __dirname,
      'templates',
      'modules', 
      'notifications',
      'templates'
    );
    console.log(`📁 Ruta configurada: ${configuredTemplatePath}`);
    console.log(`📁 Existe: ${fs.existsSync(configuredTemplatePath) ? '✅ SÍ' : '❌ NO'}`);
    
    const actualTemplatePath = path.join(__dirname, 'src', 'modules', 'notifications', 'templates');
    console.log(`📁 Ruta real: ${actualTemplatePath}`);
    console.log(`📁 Existe: ${fs.existsSync(actualTemplatePath) ? '✅ SÍ' : '❌ NO'}`);

    // 6. Conectar a la base de datos
    console.log('\n🗄️ Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // 7. Verificar usuarios existentes
    const users = await dataSource.getRepository(Users).find({ take: 3 });
    console.log(`\n👥 Usuarios encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('📋 Usuarios de prueba:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
    } else {
      console.log('❌ No hay usuarios para probar');
      return;
    }

    // 8. Probar envío de email
    console.log('\n📤 Probando envío de email...');
    const testUser = users[0];
    
    try {
      // Leer plantilla de registro
      const signUpTemplatePath = path.join(templatesDir, 'signUp-confirmation.hbs');
      let emailHtml = '';
      
      if (fs.existsSync(signUpTemplatePath)) {
        emailHtml = fs.readFileSync(signUpTemplatePath, 'utf8');
        // Reemplazar variables de la plantilla
        emailHtml = emailHtml.replace(/\{\{name\}\}/g, testUser.name);
      } else {
        emailHtml = `
          <html>
            <body>
              <h2>¡Bienvenido a Lienzo Culinario, ${testUser.name}!</h2>
              <p>Este es un email de prueba para verificar la configuración.</p>
            </body>
          </html>
        `;
      }

      const mailOptions = {
        from: `"Lienzo Culinario" <${process.env.EMAIL_USER}>`,
        to: testUser.email,
        subject: `¡Bienvenido a Lienzo Culinario, ${testUser.name}! 🎉`,
        html: emailHtml,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Destinatario: ${testUser.email}`);
      
    } catch (emailError) {
      console.log('❌ Error enviando email:', emailError.message);
      console.log('💡 Verifica la configuración SMTP y las credenciales');
    }

    // 9. Verificar configuración del módulo
    console.log('\n⚙️ Verificando configuración del módulo...');
    console.log('📧 Host SMTP:', process.env.NODEMAILER_HOST);
    console.log('📧 Puerto SMTP:', process.env.NODEMAILER_PORT);
    console.log('📧 Seguro:', process.env.NODEMAILER_SECURE);
    console.log('📧 Usuario:', process.env.EMAIL_USER);

    console.log('\n✅ ===== DIAGNÓSTICO COMPLETADO =====');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el diagnóstico
testNotifications();
