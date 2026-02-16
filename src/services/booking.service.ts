import { http } from "./http";
import type { ApiResponse } from "../types/api";

interface BookingCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface BookingStudio {
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

interface BookingPackage {
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
  studio: BookingStudio;
}

interface BookingAddonItem {
  id: number;
  booking_id: number;
  addon_id: number;
  qty: number;
  price: string;
  subtotal: string;
  created_at: string;
  updated_at: string;
  addon: {
    id: number;
    package_id: number;
    name: string;
    price: string;
    type: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface Booking {
  id: number;
  invoice_number: string;
  customer_id: number;
  package_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_reference: string | null;
  payment_expired_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: BookingCustomer;
  package: BookingPackage;
  booking_addons: BookingAddonItem[];
}

export interface BookingMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

type BookingListApiResponse = ApiResponse<Booking[]> & {
  meta: BookingMeta;
};

export interface BookingListParams {
  page?: number;
  per_page?: number;
}

export const getAdminBookings = async (
  params?: BookingListParams,
): Promise<{ data: Booking[]; meta: BookingMeta }> => {
  const { data } = await http.get<BookingListApiResponse>("/admin/bookings", {
    params,
  });

  return {
    data: data.data,
    meta: data.meta,
  };
};

export interface UpdateBookingStatusPayload {
  status: string;
  payment_status: string;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
}

export interface RescheduleBookingPayload {
  booking_date: string;
  start_time: string;
  notes?: string;
}

export const updateBookingStatus = async (
  bookingId: number,
  payload: UpdateBookingStatusPayload,
): Promise<void> => {
  await http.post<ApiResponse<unknown>>(`/admin/bookings/${bookingId}/status`, payload);
};

export const rescheduleBooking = async (
  bookingId: number,
  payload: RescheduleBookingPayload,
): Promise<void> => {
  await http.post<ApiResponse<unknown>>(`/admin/bookings/${bookingId}/reschedule`, payload);
};
