import type { SubscriptionStatus } from '../../types';
import { axiosInstance } from './client';
import type { CheckoutPayload } from './contracts';

export const subscriptionService = {
  getMe: async () => {
    const response =
      await axiosInstance.get<SubscriptionStatus>('/subscription/me');
    return response.data;
  },
  checkout: async (payload: CheckoutPayload) => {
    const response = await axiosInstance.post<{
      mode: 'simulated' | 'stripe';
      checkout_url: string | null;
      message?: string;
    }>('/subscription/checkout', payload);
    return response.data;
  },
  portal: async () => {
    const response = await axiosInstance.post<{ portal_url: string }>(
      '/subscription/portal',
    );
    return response.data;
  },
};

export type { CheckoutPayload } from './contracts';
