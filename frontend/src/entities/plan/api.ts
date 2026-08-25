import { http as axiosInstance } from '@shared/api/http';
import {
  checkoutResponseSchema,
  portalResponseSchema,
  subscriptionStatusSchema,
  type CheckoutPayload,
} from './model';

export const planApi = {
  subscriptionStatus: async () =>
    subscriptionStatusSchema.parse(
      (await axiosInstance.get('/subscription/me')).data,
    ),
  checkout: async (payload: CheckoutPayload) =>
    checkoutResponseSchema.parse(
      (await axiosInstance.post('/subscription/checkout', payload)).data,
    ),
  portal: async () =>
    portalResponseSchema.parse(
      (await axiosInstance.post('/subscription/portal')).data,
    ),
};
