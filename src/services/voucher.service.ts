import { http } from "./http";
import type { ApiResponse } from "../types/api";

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_total: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number;
  total_usage: number;
  available_usage: number;
}

export interface VoucherMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

type ActiveVouchersResponse = ApiResponse<Voucher[]> & {
  meta: VoucherMeta;
};

export interface VoucherListParams {
  page?: number;
  per_page?: number;
}

export interface CreateVoucherPayload {
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_total: number;
  usage_limit: number;
  is_active: boolean;
}

// GET /vouchers/active list active vouchers for admin panel display.
export const getActiveVouchers = async (
  params?: VoucherListParams,
): Promise<{ data: Voucher[]; meta: VoucherMeta }> => {
  const { data } = await http.get<ActiveVouchersResponse>("/vouchers/active", {
    params,
  });

  return {
    data: data.data,
    meta: data.meta,
  };
};

// POST /admin/vouchers create new voucher.
export const createVoucher = async (
  payload: CreateVoucherPayload,
): Promise<void> => {
  await http.post<ApiResponse<unknown>>("/admin/vouchers", payload);
};
