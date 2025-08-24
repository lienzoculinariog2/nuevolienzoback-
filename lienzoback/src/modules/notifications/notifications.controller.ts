import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('cron')
  async testCron() {
    try {
      await this.notificationsService.handleWeeklyNewsletter();
      return {
        message: 'El trabajo Cron se ha ejecutado correctamente y los correos han sido enviados.',
      };
    } catch (error) {
      console.error('Error al ejecutar el trabajo Cron:', error);
      return { error: 'Ocurrió un error al ejecutar el trabajo Cron.' };
    }
  }
}
