import { useEffect, useMemo, useState } from "react";
import {
  CalendarOutlined,
  DollarOutlined,
  FundOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Card,
  Col,
  InputNumber,
  Progress,
  Row,
  Select,
  Skeleton,
  Statistic,
  Typography,
} from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../services/dashboard.service";
import { getStudios, type Studio } from "../services/studio.service";
import { clearAuthSession, getAuthEmail } from "../utils/auth";

const { Title, Paragraph } = Typography;
const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const formatCurrencyIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const monthLabel = (month: number, year: number): string =>
  new Date(year, month - 1, 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

const formatPercent = (value: number): string =>
  `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)}%`;

const formatAmount = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Dashboard page with live API summary and simple visual chart blocks.
const Dashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const email = getAuthEmail();
  const currentDate = new Date();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<number | undefined>(
    undefined,
  );
  const [loadingStudios, setLoadingStudios] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummary = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");
        const response = await getDashboardSummary({
          month: selectedMonth,
          year: selectedYear,
          studio_id: selectedStudioId,
        });
        setSummary(response);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            clearAuthSession();
            navigate("/login", { replace: true });
            return;
          }

          const apiMessage =
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Gagal mengambil data dashboard.";
          setError(apiMessage);
        } else {
          setError("Terjadi kesalahan saat mengambil data dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchSummary();
  }, [navigate, selectedMonth, selectedYear, selectedStudioId]);

  useEffect(() => {
    const fetchStudios = async (): Promise<void> => {
      try {
        setLoadingStudios(true);
        const data = await getStudios();
        setStudios(data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        setStudios([]);
      } finally {
        setLoadingStudios(false);
      }
    };

    void fetchStudios();
  }, [navigate]);

  const barData = useMemo(() => {
    const revenueToday = summary?.total_revenue_today ?? 0;
    const revenueMonth = summary?.total_revenue_month ?? 0;
    const bookingToday = summary?.total_booking_today ?? 0;
    const bookingMonth = summary?.total_booking_month ?? 0;
    const maxValue = Math.max(
      revenueToday,
      revenueMonth,
      bookingToday,
      bookingMonth,
      1,
    );

    return [
      { label: "Revenue Today", value: revenueToday, color: "#00bfc3" },
      { label: "Revenue Month", value: revenueMonth, color: "#ff2273" },
      { label: "Booking Today", value: bookingToday, color: "#ffd33b" },
      { label: "Booking Month", value: bookingMonth, color: "#000000" },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / maxValue) * 100),
    }));
  }, [summary]);

  const bookingProgress = useMemo(() => {
    if (!summary || summary.total_booking_month === 0) return 0;
    return Math.min(
      100,
      Math.round(
        (summary.total_booking_today /
          Math.max(summary.total_booking_month, 1)) *
          100,
      ),
    );
  }, [summary]);

  const topProducts = summary?.top_products ?? [];
  const colorPalette = ["#3f6fc9", "#df3b33", "#ed9a34", "#4a9620", "#8f3f9f"];
  const displayedTopProducts = topProducts.slice(0, 5);

  const topProductsChartData = useMemo(() => {
    const total = displayedTopProducts.reduce(
      (acc, item) => acc + Number(item.total_amount ?? 0),
      0,
    );

    if (total <= 0) {
      return [];
    }

    return displayedTopProducts.map((item, index) => {
      const value = Number(item.total_amount ?? 0);
      const percent = total > 0 ? (value / total) * 100 : 0;
      return {
        ...item,
        color: colorPalette[index % colorPalette.length],
        displayPercent: percent,
      };
    });
  }, [displayedTopProducts]);

  const donutBackground = useMemo(() => {
    if (topProductsChartData.length === 0) {
      return "conic-gradient(#e5e7eb 0deg 360deg)";
    }

    let cumulative = 0;
    const stops = topProductsChartData.map((item) => {
      const start = cumulative;
      cumulative += item.displayPercent;
      return `${item.color} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [topProductsChartData]);

  return (
    <div>
      <Title level={2} className="!mb-2 !text-brand-black">
        Dashboard
      </Title>
      <Paragraph className="!mb-6 !text-brand-black/70">
        Halo, {email}. Ringkasan performa booking dan pendapatan bulan ini ditampilkan secara real-time.
      </Paragraph>

      <Card className="!mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-[180px]">
            <p className="mb-1 text-xs font-medium text-brand-black/60">
              Month
            </p>
            <Select
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              className="w-full"
              options={MONTH_OPTIONS}
            />
          </div>
          <div className="min-w-[180px]">
            <p className="mb-1 text-xs font-medium text-brand-black/60">Year</p>
            <InputNumber
              value={selectedYear}
              onChange={(value) =>
                setSelectedYear(value ?? currentDate.getFullYear())
              }
              className="!w-full"
              min={2000}
              max={2100}
            />
          </div>
          <div className="min-w-[220px]">
            <p className="mb-1 text-xs font-medium text-brand-black/60">
              Studio
            </p>
            <Select
              allowClear
              showSearch
              loading={loadingStudios}
              value={selectedStudioId}
              onChange={(value) => setSelectedStudioId(value)}
              placeholder="Semua studio"
              className="w-full"
              optionFilterProp="label"
              options={studios.map((studio) => ({
                value: studio.id,
                label: studio.name,
              }))}
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
                  className="font-bold"
                  title="Booking Hari Ini"
                  value={summary?.total_booking_today ?? 0}
                  valueStyle={{ color: "#00bfc3" }}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  className="font-bold"
                  title="Booking Bulan Ini"
                  value={summary?.total_booking_month ?? 0}
                  valueStyle={{ color: "#000000" }}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  className="font-bold"
                  title="Revenue Hari Ini"
                  value={formatCurrencyIDR(summary?.total_revenue_today ?? 0)}
                  valueStyle={{ color: "#ffd33b" }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  className="font-bold"
                  title="Revenue Bulan Ini"
                  value={formatCurrencyIDR(summary?.total_revenue_month ?? 0)}
                  valueStyle={{ color: "#ff2273" }}
                  prefix={<FundOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-5">
            <Col xs={24} xl={8}>
              <Card
                title="Mini Chart - Perbandingan KPI"
                className="h-full border border-brand-black/10"
              >
                <div className="space-y-4">
                  {barData.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm text-brand-black/70">
                        <span>{item.label}</span>
                        <span className="font-semibold text-brand-black/75">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-brand-teal/5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={6}>
              <Card
                title={`Progress Booking (${monthLabel(summary?.month ?? 1, summary?.year ?? 2026)})`}
                className="h-full border border-brand-black/10"
              >
                <div className="mb-4 flex justify-center">
                  <Progress
                    type="dashboard"
                    percent={bookingProgress}
                    strokeColor="#00bfc3"
                    trailColor="#ffd33b33"
                    format={(percent) => `${percent ?? 0}%`}
                  />
                </div>
                <Paragraph className="!mb-0 !text-sm !text-brand-black/70">
                  Rasio booking hari ini terhadap total booking bulan berjalan.
                </Paragraph>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-brand-black/70">
                    <span>Booking Hari Ini</span>
                    <span className="font-semibold text-brand-black">
                      {summary?.total_booking_today ?? 0}
                    </span>
                  </div>
                  <Progress
                    percent={bookingProgress}
                    strokeColor="#ff2273"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={10}>
              <Card
                title={
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <TrophyOutlined className="text-brand-pink" />
                    <span>Top Produk Berdasarkan Jumlah</span>
                  </div>
                }
                extra={
                  <div className="text-right flex-col items-center gap-2">
                    <p className="mb-0 text-[11px] uppercase tracking-wide text-brand-black/50">
                      Total
                    </p>
                    <p className="mb-0 text-lg font-semibold text-brand-black/70">
                      {formatAmount(summary?.top_products_total_amount ?? 0)}
                    </p>
                  </div>
                }
                className="h-full border border-brand-black/10"
              >
                {topProducts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-brand-black/60">
                    Belum ada data produk teratas pada periode{" "}
                    {monthLabel(summary?.month ?? 1, summary?.year ?? 2026)}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr] md:items-center">
                    <div className="flex justify-center">
                      <div
                        className="flex size-44 items-center justify-center rounded-full"
                        style={{ background: donutBackground }}
                      >
                        <div className="size-32 rounded-full bg-white" />
                      </div>
                    </div>

                    <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                      {topProductsChartData.map((item) => (
                        <div
                          key={item.package_id}
                          className="flex items-start gap-3 rounded-lg border border-brand-black/10 p-2"
                        >
                          <div
                            className="mt-1 h-12 w-1 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <p className="mb-0 text-base font-semibold leading-none text-brand-black/85">
                              {formatAmount(item.total_amount)}
                            </p>
                            <p className="mb-0 mt-1 text-sm leading-none text-brand-black/65">
                              {item.package_name}
                            </p>
                            <p className="mb-0 mt-1 text-xs text-brand-black/50">
                              {item.total_bookings} booking
                            </p>
                            <p className="mb-0 mt-1 text-sm font-medium leading-none text-brand-black/55">
                              {formatPercent(item.percentage)} kontribusi
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
