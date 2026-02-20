import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography,
  notification,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  getAdminBookings,
  rescheduleBooking,
  type Booking,
  updateBookingStatus,
} from "../services/booking.service";
import {
  getStudioPackages,
  type StudioPackage,
} from "../services/package.service";
import { getStudios, type Studio } from "../services/studio.service";
import { clearAuthSession } from "../utils/auth";

const { Title, Paragraph, Text } = Typography;

interface StatusFormValues {
  status: string;
  payment_status: string;
}

interface RescheduleFormValues {
  booking_date: Dayjs;
  start_time: Dayjs;
}

interface BookingFilters {
  search: string;
  studioId?: number;
  packageId?: number;
}

const currencyIDR = (value: string | number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

interface ParsedBookingNotes {
  background: string;
  allowSocialMediaUpload: string;
  bookingNotes: string;
}

const parseBookingNotes = (notes: string | null): ParsedBookingNotes => {
  if (!notes) {
    return {
      background: "-",
      allowSocialMediaUpload: "-",
      bookingNotes: "-",
    };
  }

  try {
    const parsed = JSON.parse(notes) as
      | string
      | {
          preferences?: {
            background?: string;
            allow_social_media_upload?: string;
          };
          notes?: string;
        };

    if (typeof parsed === "string") {
      return {
        background: "-",
        allowSocialMediaUpload: "-",
        bookingNotes: parsed || "-",
      };
    }

    return {
      background: parsed.preferences?.background ?? "-",
      allowSocialMediaUpload:
        parsed.preferences?.allow_social_media_upload ?? "-",
      bookingNotes: parsed.notes ?? "-",
    };
  } catch {
    return {
      background: "-",
      allowSocialMediaUpload: "-",
      bookingNotes: notes,
    };
  }
};

const statusColor = (status: string): string => {
  const key = status.toLowerCase();
  if (key === "confirmed") return "blue";
  if (key === "paid" || key === "completed") return "green";
  if (key === "pending" || key === "unpaid") return "orange";
  if (key === "cancelled" || key === "failed") return "red";
  return "default";
};

const Bookings = (): JSX.Element => {
  const navigate = useNavigate();
  const [statusForm] = Form.useForm<StatusFormValues>();
  const [rescheduleForm] = Form.useForm<RescheduleFormValues>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<BookingFilters>({
    search: "",
  });
  const [studios, setStudios] = useState<Studio[]>([]);
  const [studioPackages, setStudioPackages] = useState<StudioPackage[]>([]);
  const [studioOptionsLoading, setStudioOptionsLoading] =
    useState<boolean>(false);
  const [packageOptionsLoading, setPackageOptionsLoading] =
    useState<boolean>(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState<boolean>(false);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] =
    useState<boolean>(false);
  const [isRescheduleSubmitting, setIsRescheduleSubmitting] =
    useState<boolean>(false);

  const handleUnauthorized = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const fetchBookings = async (
    nextPage = page,
    nextPerPage = perPage,
    nextFilters = filters,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminBookings({
        page: nextPage,
        per_page: nextPerPage,
        search: nextFilters.search.trim() || undefined,
        studio_id: nextFilters.studioId,
        package_id: nextFilters.packageId,
      });

      setBookings(result.data);
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
          "Gagal mengambil data booking.";
        setError(apiMessage);
      } else {
        setError("Terjadi kesalahan saat mengambil data booking.");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeStatusModal = (): void => {
    setIsStatusModalOpen(false);
    setSelectedBooking(null);
    statusForm.resetFields();
  };

  const closeRescheduleModal = (): void => {
    setIsRescheduleModalOpen(false);
    setSelectedBooking(null);
    rescheduleForm.resetFields();
  };

  const openStatusModal = (booking: Booking): void => {
    setSelectedBooking(booking);
    statusForm.setFieldsValue({
      status: booking.status,
      payment_status: booking.payment_status,
    });
    setIsStatusModalOpen(true);
  };

  const openRescheduleModal = (booking: Booking): void => {
    setSelectedBooking(booking);
    rescheduleForm.setFieldsValue({
      booking_date: dayjs(booking.booking_date.slice(0, 10)),
      start_time: dayjs(`2000-01-01T${booking.start_time}`),
    });
    setIsRescheduleModalOpen(true);
  };

  const handleSubmitStatus = async (
    values: StatusFormValues,
  ): Promise<void> => {
    if (!selectedBooking) return;

    try {
      setIsStatusSubmitting(true);
      await updateBookingStatus(selectedBooking.id, {
        status: values.status,
        payment_status: values.payment_status,
      });
      notification.success({ message: "Status booking berhasil diupdate" });
      closeStatusModal();
      await fetchBookings(page, perPage, filters);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        notification.error({
          message: "Update status gagal",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat update status booking.",
        });
      } else {
        notification.error({
          message: "Update status gagal",
          description: "Terjadi kesalahan saat update status booking.",
        });
      }
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleSubmitReschedule = async (
    values: RescheduleFormValues,
  ): Promise<void> => {
    if (!selectedBooking) return;

    try {
      setIsRescheduleSubmitting(true);
      await rescheduleBooking(selectedBooking.id, {
        booking_date: values.booking_date.format("YYYY-MM-DD"),
        start_time: values.start_time.format("HH:mm"),
      });
      notification.success({ message: "Booking berhasil di-reschedule" });
      closeRescheduleModal();
      await fetchBookings(page, perPage, filters);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        notification.error({
          message: "Reschedule gagal",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat reschedule booking.",
        });
      } else {
        notification.error({
          message: "Reschedule gagal",
          description: "Terjadi kesalahan saat reschedule booking.",
        });
      }
    } finally {
      setIsRescheduleSubmitting(false);
    }
  };

  useEffect(() => {
    void fetchBookings(1, perPage);
    void fetchStudios();
  }, []);

  const fetchStudios = async (): Promise<void> => {
    try {
      setStudioOptionsLoading(true);
      const result = await getStudios();
      setStudios(result);
    } catch {
      setStudios([]);
    } finally {
      setStudioOptionsLoading(false);
    }
  };

  const fetchPackagesByStudio = async (studioId: number): Promise<void> => {
    try {
      setPackageOptionsLoading(true);
      const result = await getStudioPackages(studioId);
      setStudioPackages(result);
    } catch {
      setStudioPackages([]);
    } finally {
      setPackageOptionsLoading(false);
    }
  };

  const onApplyFilters = (): void => {
    void fetchBookings(1, perPage, filters);
  };

  const onResetFilters = (): void => {
    const emptyFilters: BookingFilters = {
      search: "",
      studioId: undefined,
      packageId: undefined,
    };
    setStudioPackages([]);
    setFilters(emptyFilters);
    void fetchBookings(1, perPage, emptyFilters);
  };

  const handleStudioFilterChange = (value?: number): void => {
    const nextStudioId = value ?? undefined;
    setFilters((prev) => ({
      ...prev,
      studioId: nextStudioId,
      packageId: undefined,
    }));

    if (!nextStudioId) {
      setStudioPackages([]);
      return;
    }

    void fetchPackagesByStudio(nextStudioId);
  };

  const columns: ColumnsType<Booking> = [
    {
      title: "Invoice",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 210,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Customer",
      key: "customer",
      width: 190,
      render: (_, record) => (
        <div>
          <p className="mb-0 font-medium text-brand-black">
            {record.customer.name}
          </p>
          <p className="mb-0 text-xs text-brand-black/60">
            {record.customer.phone}
          </p>
        </div>
      ),
    },
    {
      title: "Studio / Paket",
      key: "package",
      width: 230,
      render: (_, record) => (
        <div>
          <p className="mb-0 text-sm font-medium text-brand-black">
            {record.package.studio.name}
          </p>
          <p className="mb-0 text-xs text-brand-black/60">
            {record.package.name}
          </p>
        </div>
      ),
    },
    {
      title: "Jadwal",
      key: "schedule",
      width: 200,
      render: (_, record) => (
        <div>
          <p className="mb-0 text-sm text-brand-black/80">
            {formatDate(record.booking_date)}
          </p>
          <p className="mb-0 text-xs text-brand-black/60">
            {record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}
          </p>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      align: "right",
      width: 150,
      render: (value: string) => <Text strong>{currencyIDR(value)}</Text>,
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_, record) => (
        <Space>
          <Tag className="uppercase" color={statusColor(record.status)}>
            {record.status}
          </Tag>
          <Tag className="uppercase" color={statusColor(record.payment_status)}>
            {record.payment_status}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openStatusModal(record)}>
            Change Status
          </Button>
          <Button size="small" onClick={() => openRescheduleModal(record)}>
            Reschedule
          </Button>
        </Space>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig): void => {
    const nextPage = pagination.current ?? 1;
    const nextPerPage = pagination.pageSize ?? perPage;
    void fetchBookings(nextPage, nextPerPage, filters);
  };

  const expandedRowRender = (record: Booking): JSX.Element => {
    const parsedNotes = parseBookingNotes(record.notes);

    return (
      <div className="space-y-3">
        <Descriptions size="small" bordered column={2}>
          <Descriptions.Item label="Payment Method">
            {record.payment_method}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Ref">
            {record.payment_reference ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Expired At">
            {record.payment_expired_at
              ? new Date(record.payment_expired_at).toLocaleString("id-ID")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Email">
            {record.customer.email}
          </Descriptions.Item>
          <Descriptions.Item label="Background">
            {parsedNotes.background}
          </Descriptions.Item>
          <Descriptions.Item label="Izin Upload Sosial Media">
            {parsedNotes.allowSocialMediaUpload}
          </Descriptions.Item>
        </Descriptions>

        <Card size="small" title="Booking Notes">
          <pre className="mb-0 overflow-x-auto whitespace-pre-wrap text-xs text-brand-black/70">
            {parsedNotes.bookingNotes}
          </pre>
        </Card>

        <Card size="small" title="Add-ons">
          {record.booking_addons.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Tidak ada add-ons"
            />
          ) : (
            <div className="space-y-2">
              {record.booking_addons.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border border-brand-black/10 px-3 py-2"
                >
                  <div>
                    <p className="mb-0 text-sm font-medium text-brand-black">
                      {item.addon.name}
                    </p>
                    <p className="mb-0 text-xs text-brand-black/60">
                      {item.qty} x {currencyIDR(item.price)}
                    </p>
                  </div>
                  <Text strong>{currencyIDR(item.subtotal)}</Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const paidCount = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.payment_status.toLowerCase() === "paid",
      ).length,
    [bookings],
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-brand-black">
            Bookings
          </Title>
          <Paragraph className="!mb-0 !text-brand-black/70">
            Daftar booking pelanggan dari endpoint admin booking.
          </Paragraph>
        </div>

        <Space>
          <Tag color="blue">Total: {total}</Tag>
          <Tag color="green">Paid (page): {paidCount}</Tag>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void fetchBookings(page, perPage, filters)}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Card
        className="mb-6 rounded-xl shadow-sm border border-gray-200"
        size="small"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <Text className="mb-1 text-xs font-medium text-gray-500">
              Search
            </Text>
            <Input
              allowClear
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              onPressEnter={onApplyFilters}
              placeholder="Invoice / customer name"
              className="rounded-lg"
            />
          </div>

          {/* Studio */}
          <div className="flex flex-col">
            <Text className="mb-1 text-xs font-medium text-gray-500">
              Studio
            </Text>
            <Select
              allowClear
              showSearch
              loading={studioOptionsLoading}
              value={filters.studioId}
              onChange={handleStudioFilterChange}
              placeholder="Select studio"
              optionFilterProp="label"
              className="w-full"
              options={studios.map((studio) => ({
                value: studio.id,
                label: studio.name,
              }))}
            />
          </div>

          {/* Package */}
          <div className="flex flex-col">
            <Text className="mb-1 text-xs font-medium text-gray-500">
              Package
            </Text>
            <Select
              allowClear
              showSearch
              disabled={!filters.studioId}
              loading={packageOptionsLoading}
              value={filters.packageId}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  packageId: value ?? undefined,
                }))
              }
              placeholder={
                filters.studioId ? "Select package" : "Select studio first"
              }
              optionFilterProp="label"
              className="w-full"
              options={studioPackages.map((pkg) => ({
                value: pkg.id,
                label: pkg.name,
              }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-start md:justify-end">
            <Button
              type="primary"
              onClick={onApplyFilters}
              className="rounded-lg px-6"
            >
              Apply Filter
            </Button>

            <Button onClick={onResetFilters} className="rounded-lg px-6">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title={`Change Status${selectedBooking ? ` - ${selectedBooking.invoice_number}` : ""}`}
        open={isStatusModalOpen}
        onCancel={closeStatusModal}
        onOk={() => statusForm.submit()}
        confirmLoading={isStatusSubmitting}
        okText="Update"
        centered
      >
        <Form<StatusFormValues>
          layout="vertical"
          form={statusForm}
          onFinish={handleSubmitStatus}
        >
          <Form.Item
            label="Booking Status"
            name="status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select
              options={[
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Payment Status"
            name="payment_status"
            rules={[
              { required: true, message: "Payment status wajib dipilih" },
            ]}
          >
            <Select
              options={[
                { label: "Unpaid", value: "unpaid" },
                { label: "Paid", value: "paid" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Reschedule${selectedBooking ? ` - ${selectedBooking.invoice_number}` : ""}`}
        open={isRescheduleModalOpen}
        onCancel={closeRescheduleModal}
        onOk={() => rescheduleForm.submit()}
        confirmLoading={isRescheduleSubmitting}
        okText="Reschedule"
        centered
      >
        <Form<RescheduleFormValues>
          layout="vertical"
          form={rescheduleForm}
          onFinish={handleSubmitReschedule}
        >
          <Form.Item
            label="Booking Date"
            name="booking_date"
            rules={[{ required: true, message: "Tanggal booking wajib diisi" }]}
          >
            <DatePicker className="!w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="start_time"
            rules={[{ required: true, message: "Jam mulai wajib diisi" }]}
          >
            <TimePicker className="!w-full" format="HH:mm" minuteStep={5} />
          </Form.Item>
        </Form>
      </Modal>

      {error ? (
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="Booking error"
          description={error}
        />
      ) : null}

      <Table<Booking>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={bookings}
        scroll={{ x: 1360 }}
        expandable={{ expandedRowRender }}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          showSizeChanger: true,
          showTotal: (count) => `${count} bookings`,
        }}
        onChange={onTableChange}
      />
    </div>
  );
};

export default Bookings;
