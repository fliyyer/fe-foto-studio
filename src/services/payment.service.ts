import { http } from "./http";
import type { ApiResponse } from "../types/api";

interface PaymentHistoryStudio {
  id: number;
  name: string;
  address: string;
  city: string;
  thumbnail: string | null;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

interface PaymentHistoryPackage {
  id: number;
  studio_id: number;
  name: string;
  category: string;
  thumbnail: string | null;
  price: string;
  duration_minutes: number;
  slot_duration: number;
  max_booking_per_slot: number;
  description: string;
  max_person: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  studio: PaymentHistoryStudio;
}

interface PaymentHistoryCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface PaymentHistoryBooking {
  id: number;
  invoice_number: string;
  customer_id: number;
  package_id: number;
  voucher_id: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  subtotal_price: number;
  discount_amount: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_reference: string | null;
  payment_expired_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: PaymentHistoryCustomer;
  package: PaymentHistoryPackage;
}

export interface PaymentHistoryItem {
  id: number;
  booking_id: number;
  method: string;
  amount: number;
  transaction_id: string;
  payment_status: string;
  paid_at: string | null;
  raw_response: string | null;
  created_at: string;
  updated_at: string;
  booking: PaymentHistoryBooking;
}

export interface PaymentHistoryMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaymentHistoryParams {
  page?: number;
  per_page?: number;
  payment_status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

type PaymentHistoryResponse = ApiResponse<PaymentHistoryItem[]> & {
  meta: PaymentHistoryMeta;
};

// GET /admin/payments/history list payment transactions with filters.
export const getAdminPaymentHistory = async (
  params?: PaymentHistoryParams,
): Promise<{ data: PaymentHistoryItem[]; meta: PaymentHistoryMeta }> => {
  const { data } = await http.get<PaymentHistoryResponse>(
    "/admin/payments/history",
    {
      params,
    },
  );

  return {
    data: data.data,
    meta: data.meta,
  };
};
