import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import { Orders } from '../orders/entities/order.entity';
import { Products } from '../products/entities/product.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(Products)
    private productRepository: Repository<Products>,
  ) {}

  async sendRegistrationConfirmation(user: Users) {
    try {
      this.logger.log(`📧 Intentando enviar email de confirmación a ${user.email}`);
      
      // Validar que el usuario tenga email
      if (!user.email) {
        this.logger.warn(`⚠️ Usuario ${user.id} no tiene email configurado`);
        return;
      }

      await this.mailerService.sendMail({
        to: user.email,
        subject: `¡Bienvenido a Lienzo Culinario, ${user.name || 'Usuario'}! 🎉`,
        template: 'signUp-confirmation',
        context: {
          name: user.name || user.email.split('@')[0],
        },
      });
      this.logger.log(`✅ Registration confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`❌ Error sending registration email to ${user.email}:`, error.message);
      this.logger.error(`❌ Error details:`, error);
      
      // No lanzar el error para no afectar el registro del usuario
      // Solo loggear el error para debugging
      if (error.code) {
        this.logger.error(`❌ Error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`❌ SMTP response: ${error.response}`);
      }
    }
  }

  async sendPurchaseConfirmation(order: Orders) {
    try {
      await this.mailerService.sendMail({
        to: order.user.email,
        subject: `Confirmación de compra #${order.id}`,
        template: 'purchase-confirmation',
        context: {
          order,
        },
      });
      this.logger.log(`Purchase confirmation email sent to ${order.user.email}`);
    } catch (error) {
      this.logger.error(`Error sending purchase confirmation email to ${order.user.email}:`, error.message);
      // No lanzar el error para no afectar el proceso de compra
    }
  }

  @Cron('0 0 8 * * 4', { name: 'weekly-newsletter' }) // (seg min hora diaMes mes díaSemana ) lunes 8:00 a.m

  //@Cron('*/10 * * * *') // cada minutos
  async handleWeeklyNewsletter() {
    this.logger.log('Executing Cron Job: Sending weekly newsletter');
    try {
      const users = await this.userRepository.find();
      const products = await this.productRepository.find();
      const subscribedUsers = await this.userRepository.find({
        where: { isSuscribed: true },
      });
      for (const user of subscribedUsers) {
        try {
          await this.mailerService.sendMail({
            to: user.email,
            subject: 'Obras culinarias de la semana 🧑‍🍳',
            template: 'weekly-newsletter',
            context: {
              name: user.name,
              products: products,
            },
          });
        } catch (error) {
          this.logger.error(`Error sending newsletter to ${user.email}:`, error.message);
          // Continuar con el siguiente usuario
        }
      }
      this.logger.log(`Newsletters sent to ${users.length} users.`);
    } catch (error) {
      this.logger.error(`Error sending weekly newsletter:`, error);
    }
  }
}
