import { http } from "./http";
import type { ApiResponse } from "../types/api";

interface BookingAddonPayload {
  addon_id: number;
  qty: number;
}

interface BookingCustomerPayload {
  name: string;
  phone: string;
  email: string;
}

interface BookingPreferencesPayload {
  background: string;
  allow_social_media_upload: string;
}

export interface CreateOrderBookingPayload {
  booking_date: string;
  start_time: string;
  payment_method: string;
  voucher_code?: string;
  customer: BookingCustomerPayload;
  addons: BookingAddonPayload[];
  preferences: BookingPreferencesPayload;
  notes?: string;
}

export interface BookingSubmitResult {
  message: string;
  data: unknown;
  payment?: {
    provider: string;
    mode: string;
    order_id: string;
    amount: number;
    payment_method: string;
    payment_url?: string;
    expired_at?: string;
  };
}

export interface BookingPaymentStatusResult {
  message: string;
  data?: unknown;
  payment?: {
    provider?: string;
    mode?: string;
    order_id?: string;
    amount?: number;
    payment_method?: string;
    payment_url?: string;
    expired_at?: string;
    status?: string;
    payment_status?: string;
  };
}

// POST /studios/:studioId/packages/:packageId/bookings create customer booking order.
export const createOrderBooking = async (
  studioId: number,
  packageId: number,
  payload: CreateOrderBookingPayload,
): Promise<BookingSubmitResult> => {
  const { data } = await http.post<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}/bookings`,
    payload,
  );

  return data;
};

// GET /bookings/:invoiceNumber/payment-status for fallback payment verification.
export const getBookingPaymentStatus = async (
  invoiceNumber: string,
): Promise<BookingPaymentStatusResult> => {
  const { data } = await http.get<BookingPaymentStatusResult>(
    `/bookings/${invoiceNumber}/payment-status`,
  );
  return data;
};
