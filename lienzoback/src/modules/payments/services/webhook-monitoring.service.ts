import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import Stripe from 'stripe';

export interface WebhookEventLog {
  id: string;
  eventType: string;
  paymentIntentId?: string;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  processedAt: Date;
  metadata?: any;
}

@Injectable()
export class WebhookMonitoringService {
  private readonly logger = new Logger(WebhookMonitoringService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Log webhook event for monitoring
   */
  async logWebhookEvent(event: Stripe.Event, status: 'success' | 'failed', errorMessage?: string): Promise<void> {
    const paymentIntentId = this.extractPaymentIntentId(event);
    
    this.logger.log(`Webhook Event: ${event.type} | Status: ${status} | PaymentIntent: ${paymentIntentId}`);

    // Store event log in payment metadata
    if (paymentIntentId) {
      await this.updatePaymentEventLog(paymentIntentId, {
        id: event.id,
        eventType: event.type,
        paymentIntentId,
        status,
        errorMessage,
        processedAt: new Date(),
        metadata: {
          eventId: event.id,
          eventType: event.type,
          created: event.created,
          livemode: event.livemode,
        },
      });
    }

    // Log to external monitoring service (if configured)
    await this.sendToMonitoringService(event, status, errorMessage);
  }

  /**
   * Get webhook event statistics
   */
  async getWebhookStats(days: number = 7): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    eventTypes: Record<string, number>;
    recentFailures: WebhookEventLog[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get payments with webhook events in the last N days
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.processedAt >= :since', { since })
      .andWhere('payment.metadata IS NOT NULL')
      .getMany();

    const stats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventTypes: {} as Record<string, number>,
      recentFailures: [] as WebhookEventLog[],
    };

    payments.forEach(payment => {
      if (payment.metadata?.lastEvent) {
        const event = payment.metadata.lastEvent;
        stats.totalEvents++;
        
        if (event.status === 'success') {
          stats.successfulEvents++;
        } else if (event.status === 'failed') {
          stats.failedEvents++;
          stats.recentFailures.push(event);
        }

        // Count event types
        const eventType = event.type;
        stats.eventTypes[eventType] = (stats.eventTypes[eventType] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Check for failed webhook events and alert
   */
  async checkForFailedWebhooks(): Promise<void> {
    const stats = await this.getWebhookStats(1); // Last 24 hours

    if (stats.failedEvents > 0) {
      this.logger.warn(`Found ${stats.failedEvents} failed webhook events in the last 24 hours`);
      
      // Send alert to monitoring service
      await this.sendAlert({
        type: 'webhook_failures',
        message: `${stats.failedEvents} webhook events failed in the last 24 hours`,
        failures: stats.recentFailures,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Monitor webhook processing time
   */
  async monitorProcessingTime(event: Stripe.Event, startTime: number): Promise<void> {
    const processingTime = Date.now() - startTime;
    
    if (processingTime > 5000) { // Alert if processing takes more than 5 seconds
      this.logger.warn(`Webhook processing took ${processingTime}ms for event ${event.type}`);
      
      await this.sendAlert({
        type: 'slow_webhook_processing',
        message: `Webhook processing took ${processingTime}ms`,
        eventType: event.type,
        processingTime,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Extract payment intent ID from various event types
   */
  private extractPaymentIntentId(event: Stripe.Event): string | undefined {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
      case 'payment_intent.processing':
      case 'payment_intent.requires_action':
        return (event.data.object as Stripe.PaymentIntent).id;
      case 'charge.refunded':
        return (event.data.object as Stripe.Charge).payment_intent as string;
      default:
        return undefined;
    }
  }

  /**
   * Update payment event log in metadata
   */
  private async updatePaymentEventLog(paymentIntentId: string, eventLog: WebhookEventLog): Promise<void> {
    try {
      await this.paymentRepository
        .createQueryBuilder()
        .update(Payment)
        .set({
          metadata: () => `jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{lastEvent}',
            :eventLog::jsonb
          )`,
        })
        .where('stripePaymentIntentId = :paymentIntentId', { paymentIntentId })
        .setParameter('eventLog', JSON.stringify(eventLog))
        .execute();
    } catch (error) {
      this.logger.error(`Failed to update payment event log: ${error.message}`);
    }
  }

  /**
   * Send event to external monitoring service
   */
  private async sendToMonitoringService(event: Stripe.Event, status: string, errorMessage?: string): Promise<void> {
    // TODO: Implement integration with external monitoring service
    // Examples: Sentry, DataDog, New Relic, etc.
    
    const monitoringData = {
      service: 'payments',
      event: 'webhook_processed',
      eventType: event.type,
      status,
      errorMessage,
      timestamp: new Date().toISOString(),
      metadata: {
        eventId: event.id,
        livemode: event.livemode,
      },
    };

    // For now, just log the monitoring data
    this.logger.debug('Monitoring data:', monitoringData);
  }

  /**
   * Send alert to monitoring service
   */
  private async sendAlert(alert: {
    type: string;
    message: string;
    [key: string]: any;
  }): Promise<void> {
    // TODO: Implement alert system
    // Examples: Slack, email, PagerDuty, etc.
    
    this.logger.warn(`ALERT: ${alert.type} - ${alert.message}`, alert);
  }

  /**
   * Get health status of webhook processing
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    stats: any;
  }> {
    const stats = await this.getWebhookStats(1); // Last 24 hours
    
    if (stats.totalEvents === 0) {
      return {
        status: 'warning',
        message: 'No webhook events processed in the last 24 hours',
        stats,
      };
    }

    const failureRate = (stats.failedEvents / stats.totalEvents) * 100;
    
    if (failureRate > 10) {
      return {
        status: 'critical',
        message: `High webhook failure rate: ${failureRate.toFixed(1)}%`,
        stats,
      };
    } else if (failureRate > 5) {
      return {
        status: 'warning',
        message: `Elevated webhook failure rate: ${failureRate.toFixed(1)}%`,
        stats,
      };
    }

    return {
      status: 'healthy',
      message: `Webhook processing is healthy. Success rate: ${((stats.successfulEvents / stats.totalEvents) * 100).toFixed(1)}%`,
      stats,
    };
  }
}
