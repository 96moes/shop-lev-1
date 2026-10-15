import { OrderStatus } from '../database/entities/order.entity.js';

/**
 * Persian labels for order statuses.
 *
 * Shared so an order-status notification written by the admin module and one
 * written by checkout describe the same state with the same wording.
 */
const ORDER_STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'در انتظار پرداخت',
  [OrderStatus.PAID]: 'پرداخت‌شده',
  [OrderStatus.PROCESSING]: 'در حال پردازش',
  [OrderStatus.SHIPPED]: 'ارسال‌شده',
  [OrderStatus.DELIVERED]: 'تحویل‌شده',
  [OrderStatus.CANCELLED]: 'لغوشده',
  [OrderStatus.REFUNDED]: 'بازگشت وجه',
};

/** Translates an order status into the Persian wording shown to customers. */
export function formatStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
