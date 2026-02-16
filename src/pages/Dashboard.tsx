import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, InputNumber, Progress, Row, Select, Skeleton, Statistic, Typography } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, type DashboardSummary } from '../services/dashboard.service';
import { clearAuthSession, getAuthEmail } from '../utils/auth';

const { Title, Paragraph } = Typography;

const formatCurrencyIDR = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const monthLabel = (month: number, year: number): string =>
  new Date(year, month - 1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

// Dashboard page with live API summary and simple visual chart blocks.
const Dashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const email = getAuthEmail();
  const currentDate = new Date();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  useEffect(() => {
    const fetchSummary = async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');
        const response = await getDashboardSummary({
          month: selectedMonth,
          year: selectedYear,
        });
        setSummary(response);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            clearAuthSession();
            navigate('/login', { replace: true });
            return;
          }

          const apiMessage =
            (err.response?.data as { message?: string } | undefined)?.message ??
            'Gagal mengambil data dashboard.';
          setError(apiMessage);
        } else {
          setError('Terjadi kesalahan saat mengambil data dashboard.');
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchSummary();
  }, [navigate, selectedMonth, selectedYear]);

  // Build mini-bar data for visual comparison without extra chart package.
  const barData = useMemo(() => {
    const revenueToday = summary?.total_revenue_today ?? 0;
    const revenueMonth = summary?.total_revenue_month ?? 0;
    const bookingToday = summary?.total_booking_today ?? 0;
    const bookingMonth = summary?.total_booking_month ?? 0;
    const maxValue = Math.max(revenueToday, revenueMonth, bookingToday, bookingMonth, 1);

    return [
      { label: 'Revenue Today', value: revenueToday, color: '#00bfc3' },
      { label: 'Revenue Month', value: revenueMonth, color: '#ff2273' },
      { label: 'Booking Today', value: bookingToday, color: '#ffd33b' },
      { label: 'Booking Month', value: bookingMonth, color: '#000000' },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / maxValue) * 100),
    }));
  }, [summary]);

  const bookingProgress = useMemo(() => {
    if (!summary || summary.total_booking_month === 0) return 0;
    return Math.min(
      100,
      Math.round((summary.total_booking_today / Math.max(summary.total_booking_month, 1)) * 100),
    );
  }, [summary]);

  return (
    <div>
      <Title level={2} className="!mb-2 !text-brand-black">
        Dashboard
      </Title>
      <Paragraph className="!mb-6 !text-brand-black/70">
        Welcome, {email}. Ringkasan data bulan ini ditampilkan real-time dari API.
      </Paragraph>

      <Card className="!mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-[180px]">
            <p className="mb-1 text-xs font-medium text-slate-500">Month</p>
            <Select
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              className="w-full"
              options={[
                { value: 1, label: 'January' },
                { value: 2, label: 'February' },
                { value: 3, label: 'March' },
                { value: 4, label: 'April' },
                { value: 5, label: 'May' },
                { value: 6, label: 'June' },
                { value: 7, label: 'July' },
                { value: 8, label: 'August' },
                { value: 9, label: 'September' },
                { value: 10, label: 'October' },
                { value: 11, label: 'November' },
                { value: 12, label: 'December' },
              ]}
            />
          </div>
          <div className="min-w-[180px]">
            <p className="mb-1 text-xs font-medium text-slate-500">Year</p>
            <InputNumber
              value={selectedYear}
              onChange={(value) => setSelectedYear(value ?? currentDate.getFullYear())}
              className="!w-full"
              min={2000}
              max={2100}
            />
          </div>
        </div>
      </Card>

      {error ? (
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="Dashboard error"
          description={error}
        />
      ) : null}

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Booking Hari Ini"
                  value={summary?.total_booking_today ?? 0}
                  valueStyle={{ color: '#00bfc3' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Booking Bulan Ini"
                  value={summary?.total_booking_month ?? 0}
                  valueStyle={{ color: '#000000' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Revenue Hari Ini"
                  value={formatCurrencyIDR(summary?.total_revenue_today ?? 0)}
                  valueStyle={{ color: '#ffd33b' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Revenue Bulan Ini"
                  value={formatCurrencyIDR(summary?.total_revenue_month ?? 0)}
                  valueStyle={{ color: '#ff2273' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-1">
            <Col xs={24} xl={16}>
              <Card title="Mini Chart - Perbandingan KPI">
                <div className="space-y-4">
                  {barData.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card title={`Progress Booking (${monthLabel(summary?.month ?? 1, summary?.year ?? 2026)})`}>
                <Progress
                  type="circle"
                  percent={bookingProgress}
                  strokeColor="#00bfc3"
                  format={(percent) => `${percent ?? 0}%`}
                />
                <Paragraph className="!mb-0 !mt-4 !text-slate-600">
                  Rasio booking hari ini terhadap total booking bulan berjalan.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
