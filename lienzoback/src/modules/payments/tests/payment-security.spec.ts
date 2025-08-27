import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from '../payments.service';
import { PaymentCalculationService } from '../services/payment-calculation.service';
import { PaymentManagementService } from '../services/payment-management.service';
import { Payment } from '../entities/payment.entity';
import { Orders } from '../../orders/entities/order.entity';
import { OrderDetail } from '../../orders/entities/order-detail.entity';
import { Products } from '../../products/entities/product.entity';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('Payment Security Tests', () => {
  let paymentsService: PaymentsService;
  let paymentCalculationService: PaymentCalculationService;
  let paymentManagementService: PaymentManagementService;
  let paymentRepository: Repository<Payment>;
  let ordersRepository: Repository<Orders>;
  let productsRepository: Repository<Products>;

  const mockPaymentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrdersRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PaymentCalculationService,
        PaymentManagementService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Orders),
          useValue: mockOrdersRepository,
        },
        {
          provide: getRepositoryToken(OrderDetail),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Products),
          useValue: mockProductsRepository,
        },
        {
          provide: 'ConfigService',
          useValue: {
            get: jest.fn().mockReturnValue('sk_test_123'),
          },
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    paymentCalculationService = module.get<PaymentCalculationService>(PaymentCalculationService);
    paymentManagementService = module.get<PaymentManagementService>(PaymentManagementService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    ordersRepository = module.get<Repository<Orders>>(getRepositoryToken(Orders));
    productsRepository = module.get<Repository<Products>>(getRepositoryToken(Products));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Idempotency Tests', () => {
    it('should prevent duplicate payments with same idempotency key', async () => {
      const createPaymentDto: CreatePaymentIntentDto = {
        orderId: 'order-123',
        idempotencyKey: 'unique-key-123',
      };

      // Mock existing payment with same idempotency key
      mockPaymentRepository.findOne.mockResolvedValue({
        id: 'payment-123',
        orderId: 'order-123',
        idempotencyKey: 'unique-key-123',
      });

      await expect(paymentsService.createPaymentIntent(createPaymentDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow payments with different idempotency keys', async () => {
      const createPaymentDto: CreatePaymentIntentDto = {
        orderId: 'order-123',
        idempotencyKey: 'unique-key-456',
      };

      // Mock no existing payment
      mockPaymentRepository.findOne.mockResolvedValue(null);

      // Mock order calculation
      jest.spyOn(paymentCalculationService, 'getOrderSummary').mockResolvedValue({
        orderId: 'order-123',
        amount: 15.0,
        currency: 'usd',
        description: 'Test order',
        items: [],
        customerEmail: 'test@example.com',
      });

      // Mock Stripe payment intent creation
      jest.spyOn(paymentsService['stripe'].paymentIntents, 'create').mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
        description: 'Test order',
      } as any);

      // Mock payment record creation
      jest.spyOn(paymentManagementService, 'createPaymentRecord').mockResolvedValue({
        id: 'payment-123',
        orderId: 'order-123',
        amount: 15.0,
        status: 'pending',
      } as any);

      const result = await paymentsService.createPaymentIntent(createPaymentDto);

      expect(result).toBeDefined();
      expect(result.paymentIntentId).toBe('pi_test_123');
    });
  });

  describe('Server-Side Amount Calculation Tests', () => {
    it('should calculate amount server-side and ignore client amount', async () => {
      const createPaymentDto: CreatePaymentIntentDto = {
        orderId: 'order-123',
        // No amount field - should be calculated server-side
      };

      // Mock order calculation with server-side amount
      jest.spyOn(paymentCalculationService, 'getOrderSummary').mockResolvedValue({
        orderId: 'order-123',
        amount: 25.0, // Server calculated amount
        currency: 'usd',
        description: 'Test order',
        items: [
          {
            productId: 'product-1',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 12.5,
            totalPrice: 25.0,
          },
        ],
        customerEmail: 'test@example.com',
      });

      // Mock no existing payment
      mockPaymentRepository.findOne.mockResolvedValue(null);

      // Mock Stripe payment intent creation
      jest.spyOn(paymentsService['stripe'].paymentIntents, 'create').mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 2500, // Should be 25.00 * 100
        currency: 'usd',
        status: 'requires_payment_method',
        description: 'Test order',
      } as any);

      // Mock payment record creation
      jest.spyOn(paymentManagementService, 'createPaymentRecord').mockResolvedValue({
        id: 'payment-123',
        orderId: 'order-123',
        amount: 25.0,
        status: 'pending',
      } as any);

      const result = await paymentsService.createPaymentIntent(createPaymentDto);

      expect(result.amount).toBe(25.0); // Server calculated amount
      expect(result.amount).not.toBe(0); // Not client-provided amount
    });

    it('should reject orders with zero or negative amounts', async () => {
      const createPaymentDto: CreatePaymentIntentDto = {
        orderId: 'order-123',
      };

      // Mock order calculation with zero amount
      jest.spyOn(paymentCalculationService, 'getOrderSummary').mockResolvedValue({
        orderId: 'order-123',
        amount: 0, // Invalid amount
        currency: 'usd',
        description: 'Test order',
        items: [],
        customerEmail: 'test@example.com',
      });

      await expect(paymentsService.createPaymentIntent(createPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Payment Record Creation Tests', () => {
    it('should create payment record in database after Stripe creation', async () => {
      const createPaymentDto: CreatePaymentIntentDto = {
        orderId: 'order-123',
      };

      // Mock order calculation
      jest.spyOn(paymentCalculationService, 'getOrderSummary').mockResolvedValue({
        orderId: 'order-123',
        amount: 15.0,
        currency: 'usd',
        description: 'Test order',
        items: [],
        customerEmail: 'test@example.com',
      });

      // Mock no existing payment
      mockPaymentRepository.findOne.mockResolvedValue(null);

      // Mock Stripe payment intent creation
      jest.spyOn(paymentsService['stripe'].paymentIntents, 'create').mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
        description: 'Test order',
      } as any);

      // Mock payment record creation
      const createPaymentRecordSpy = jest
        .spyOn(paymentManagementService, 'createPaymentRecord')
        .mockResolvedValue({
          id: 'payment-123',
          orderId: 'order-123',
          amount: 15.0,
          status: 'pending',
        } as any);

      await paymentsService.createPaymentIntent(createPaymentDto);

      expect(createPaymentRecordSpy).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          id: 'pi_test_123',
          amount: 1500,
        }),
      );
    });
  });

  describe('Webhook Security Tests', () => {
    it('should verify webhook signature before processing', async () => {
      const payload = Buffer.from('test payload');
      const signature = 't=1234567890,v1=invalid_signature';

      // Mock Stripe webhook verification to fail
      jest.spyOn(paymentsService['stripe'].webhooks, 'constructEvent').mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(paymentsService.handleWebhook(payload, signature)).rejects.toThrow(
        'Invalid signature',
      );
    });
  });
});
