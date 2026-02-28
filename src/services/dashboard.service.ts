import { http } from './http';

export interface DashboardSummary {
  total_booking_today: number;
  total_booking_month: number;
  total_revenue_today: number;
  total_revenue_month: number;
  month: number;
  year: number;
  top_products_total_amount: number;
  top_products: DashboardTopProduct[];
}

export interface DashboardTopProduct {
  package_id: number;
  package_name: string;
  total_bookings: number;
  total_amount: number;
  percentage: number;
}

interface DashboardApiResponse {
  message: string;
  data: DashboardSummary;
}

export interface DashboardFilter {
  month: number;
  year: number;
  studio_id?: number;
}

// GET /admin/dashboard summary for admin home page.
export const getDashboardSummary = async (
  filter?: DashboardFilter,
): Promise<DashboardSummary> => {
  const { data } = await http.get<DashboardApiResponse>('/admin/dashboard', {
    params: filter,
  });

  return data.data;
};
