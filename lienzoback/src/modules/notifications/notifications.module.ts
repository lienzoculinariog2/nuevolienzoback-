import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { Products } from '../products/entities/product.entity';
import { Orders } from '../orders/entities/order.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import * as path from 'path';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('NODEMAILER_HOST'),
          port: configService.get<number>('NODEMAILER_PORT'),
          secure: configService.get<string>('NODEMAILER_SECURE') === 'true',
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"Lienzo Culinario" <${configService.get('EMAIL_USER')}>`,
        },
        template: {
          dir: path.resolve(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users, Products, Orders]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
