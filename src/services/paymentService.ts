import { api } from './api';

export type PaymentOrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface PaymentOrderView {
  id: string;
  status: PaymentOrderStatus;
  coinsAmount: number;
  priceAmount: string;
  currency: string;
  checkoutUrl: string | null;
  expiresAt: string;
  completedAt: string | null;
}

export const paymentService = {
  /** POST /payment/orders/create */
  createOrder: async (packageId: string): Promise<PaymentOrderView> => {
    const { data } = await api.post<PaymentOrderView>('/payment/orders/create', {
      packageId,
    });
    return data;
  },

  /** GET /payment/orders/:id/status */
  getOrderStatus: async (orderId: string): Promise<PaymentOrderView> => {
    const { data } = await api.get<PaymentOrderView>(
      `/payment/orders/${orderId}/status`,
    );
    return data;
  },
};
