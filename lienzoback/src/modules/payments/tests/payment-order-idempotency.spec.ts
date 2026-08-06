import { PaymentStatus } from '../entities/payment.entity';
import { PaymentOrderService } from '../payment-order.service';

describe('PaymentOrderService webhook idempotency', () => {
  it('does not apply order side effects again for an already succeeded payment', async () => {
    const paymentRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        status: PaymentStatus.SUCCEEDED,
      }),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(paymentRepository),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn(async (work: (transactionManager: typeof manager) => Promise<boolean>) =>
        work(manager),
      ),
    };
    const cartService = { clearCart: jest.fn() };

    const service = new PaymentOrderService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      cartService as never,
      dataSource as never,
    );

    await service.handlePaymentSuccess('pi_succeeded');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(paymentRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripePaymentIntentId: 'pi_succeeded' },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(manager.findOne).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
    expect(cartService.clearCart).not.toHaveBeenCalled();
  });
});
