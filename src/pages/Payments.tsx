import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { CopyOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  getAdminPaymentHistory,
  type PaymentHistoryItem,
} from "../services/payment.service";
import { clearAuthSession } from "../utils/auth";

const { RangePicker } = DatePicker;
const { Title, Paragraph, Text } = Typography;

const formatCurrencyIDR = (value: number | string): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return dayjs(value).format("DD MMM YYYY HH:mm");
};

const tagColor = (status: string): string => {
  const key = status.toLowerCase();
  if (["completed", "paid", "success"].includes(key)) return "green";
  if (["pending", "unpaid"].includes(key)) return "orange";
  if (["failed", "cancelled", "expired"].includes(key)) return "red";
  return "default";
};

const Payments = (): JSX.Element => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [total, setTotal] = useState<number>(0);

  const [searchInput, setSearchInput] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  const handleUnauthorized = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const fetchPayments = async (
    nextPage = page,
    nextPerPage = perPage,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminPaymentHistory({
        page: nextPage,
        per_page: nextPerPage,
        payment_status: paymentStatus || undefined,
        search: appliedSearch || undefined,
        date_from: dateRange[0]?.format("YYYY-MM-DD"),
        date_to: dateRange[1]?.format("YYYY-MM-DD"),
      });

      setPayments(result.data);
      setPage(result.meta.current_page);
      setPerPage(result.meta.per_page);
      setTotal(result.meta.total);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengambil data transaksi pembayaran.";
        setError(apiMessage);
      } else {
        setError("Terjadi kesalahan saat mengambil data transaksi pembayaran.");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (): void => {
    setAppliedSearch(searchInput.trim());
    void fetchPayments(1, perPage);
  };

  const resetFilters = (): void => {
    setSearchInput("");
    setAppliedSearch("");
    setPaymentStatus("");
    setDateRange([null, null]);
    void fetchPayments(1, perPage);
  };

  const onTableChange = (pagination: TablePaginationConfig): void => {
    void fetchPayments(pagination.current ?? 1, pagination.pageSize ?? perPage);
  };

  const copyInvoice = async (invoice: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(invoice);
      notification.success({ message: `Invoice ${invoice} berhasil disalin` });
    } catch {
      notification.error({ message: "Gagal menyalin invoice" });
    }
  };

  useEffect(() => {
    void fetchPayments(1, perPage);
  }, []);

  const totalAmountPage = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.amount), 0),
    [payments],
  );

  const columns: ColumnsType<PaymentHistoryItem> = [
    {
      title: "Invoice",
      key: "invoice",
      width: 230,
      render: (_, record) => (
        <Space>
          <Text code>{record.transaction_id}</Text>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => void copyInvoice(record.transaction_id)}
          >
            Copy
          </Button>
        </Space>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      width: 200,
      render: (_, record) => (
        <div>
          <p className="mb-0 font-medium text-brand-black">{record.booking.customer.name}</p>
          <p className="mb-0 text-xs text-brand-black/60">{record.booking.customer.email}</p>
        </div>
      ),
    },
    {
      title: "Studio / Paket",
      key: "package",
      width: 240,
      render: (_, record) => (
        <div>
          <p className="mb-0 text-sm font-medium text-brand-black">
            {record.booking.package.studio.name}
          </p>
          <p className="mb-0 text-xs text-brand-black/60">{record.booking.package.name}</p>
        </div>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 150,
      render: (value: string) => <Tag color="#00bfc3">{value}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 140,
      render: (value: number) => <Text strong>{formatCurrencyIDR(value)}</Text>,
    },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 160,
      render: (value: string) => <Tag color={tagColor(value)}>{value}</Tag>,
    },
    {
      title: "Paid At",
      dataIndex: "paid_at",
      key: "paid_at",
      width: 170,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const expandedRowRender = (record: PaymentHistoryItem): JSX.Element => (
    <div className="space-y-3">
      <Descriptions size="small" bordered column={2}>
        <Descriptions.Item label="Booking ID">{record.booking_id}</Descriptions.Item>
        <Descriptions.Item label="Transaction ID">{record.transaction_id}</Descriptions.Item>
        <Descriptions.Item label="Booking Status">{record.booking.status}</Descriptions.Item>
        <Descriptions.Item label="Booking Payment Status">{record.booking.payment_status}</Descriptions.Item>
        <Descriptions.Item label="Booking Date">
          {formatDateTime(record.booking.booking_date)}
        </Descriptions.Item>
        <Descriptions.Item label="Time Slot">
          {record.booking.start_time.slice(0, 5)} - {record.booking.end_time.slice(0, 5)}
        </Descriptions.Item>
        <Descriptions.Item label="Subtotal">
          {formatCurrencyIDR(record.booking.subtotal_price)}
        </Descriptions.Item>
        <Descriptions.Item label="Discount">
          {formatCurrencyIDR(record.booking.discount_amount)}
        </Descriptions.Item>
        <Descriptions.Item label="Total">
          {formatCurrencyIDR(record.booking.total_price)}
        </Descriptions.Item>
        <Descriptions.Item label="Payment Method">{record.booking.payment_method}</Descriptions.Item>
      </Descriptions>

      <Card size="small" title="Raw Response">
        <pre className="mb-0 overflow-x-auto whitespace-pre-wrap text-xs text-brand-black/70">
          {record.raw_response || "-"}
        </pre>
      </Card>
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-brand-black">
            Payments History
          </Title>
          <Paragraph className="!mb-0 !text-brand-black/70">
            Riwayat transaksi pembayaran booking pelanggan.
          </Paragraph>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchPayments(page, perPage)}>
            Refresh
          </Button>
        </Space>
      </div>

      <Card className="mb-4 border !border-brand-black/10">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_1fr_auto]">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari invoice (contoh: INV-20260216)"
            prefix={<SearchOutlined className="text-brand-black/40" />}
            allowClear
          />

          <Select
            value={paymentStatus || undefined}
            onChange={(value: string | undefined) => setPaymentStatus(value ?? "")}
            placeholder="Filter status"
            allowClear
            options={[
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "expired", label: "Expired" },
            ]}
          />

          <RangePicker
            className="w-full"
            value={dateRange}
            onChange={(values) => setDateRange(values ?? [null, null])}
            format="YYYY-MM-DD"
          />

          <Space>
            <Button onClick={resetFilters}>Reset</Button>
            <Button type="primary" onClick={applyFilters}>
              Apply
            </Button>
          </Space>
        </div>
      </Card>

      {error ? (
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="Payments error"
          description={error}
        />
      ) : null}

      <Card className="mb-4 border !border-brand-black/10">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-brand-black/70">Total transaksi (page): <strong className="text-brand-black">{payments.length}</strong></span>
          <span className="text-brand-black/70">Nominal (page): <strong className="text-brand-black">{formatCurrencyIDR(totalAmountPage)}</strong></span>
          <span className="text-brand-black/70">Total data: <strong className="text-brand-black">{total}</strong></span>
        </div>
      </Card>

      <Card className="border !border-brand-black/10">
        <Table<PaymentHistoryItem>
          rowKey="id"
          columns={columns}
          dataSource={payments}
          loading={loading}
          scroll={{ x: 1300 }}
          expandable={{ expandedRowRender }}
          pagination={{
            current: page,
            pageSize: perPage,
            total,
            showSizeChanger: true,
          }}
          onChange={onTableChange}
        />
      </Card>
    </div>
  );
};

export default Payments;
