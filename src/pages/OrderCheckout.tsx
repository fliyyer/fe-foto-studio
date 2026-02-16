import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Typography,
  notification,
} from "antd";
import axios from "axios";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import OrderFlowHeader from "../components/OrderFlowHeader";
import {
  getStudioPackageDetail,
  type PackageAddon,
  type StudioPackageDetail,
} from "../services/package.service";
import { getActiveVouchers, type Voucher } from "../services/voucher.service";
import {
  createOrderBooking,
  getBookingPaymentStatus,
  type BookingPaymentStatusResult,
} from "../services/order.service";

const { Title, Paragraph } = Typography;

const PAYMENT_METHOD_OPTIONS = [
  { value: "cimb_niaga_va", label: "CIMB Niaga VA" },
  { value: "bni_va", label: "BNI VA" },
  { value: "qris", label: "QRIS" },
  { value: "sampoerna_va", label: "Sampoerna VA" },
  { value: "bnc_va", label: "BNC VA" },
  { value: "maybank_va", label: "Maybank VA" },
  { value: "permata_va", label: "Permata VA" },
  { value: "atm_bersama_va", label: "ATM Bersama VA" },
  { value: "artha_graha_va", label: "Artha Graha VA" },
  { value: "bri_va", label: "BRI VA" },
  { value: "paypal", label: "PayPal" },
];

interface CheckoutFormValues {
  name: string;
  phone: string;
  email: string;
  background: string;
  allow_social_upload: string;
  notes: string;
  payment_method: string;
}

const formatCurrencyIDR = (value: number | string): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (value: string): string =>
  dayjs(value).locale("id").format("D MMMM YYYY");

const resolvePaymentUrl = (result: {
  payment?: { payment_url?: string };
  data?: unknown;
}): string => {
  if (result.payment?.payment_url) return result.payment.payment_url;

  const data = result.data as
    | {
        payment?: { raw_response?: string };
      }
    | undefined;
  const rawResponse = data?.payment?.raw_response;
  if (!rawResponse) return "";

  try {
    const parsed = JSON.parse(rawResponse) as { payment_url?: string };
    return parsed.payment_url ?? "";
  } catch {
    return "";
  }
};

const resolveInvoiceNumber = (result: {
  payment?: { order_id?: string };
  data?: unknown;
}): string => {
  if (result.payment?.order_id) return result.payment.order_id;

  const data = result.data as { invoice_number?: string } | undefined;
  return data?.invoice_number ?? "";
};

const isPaymentCompleted = (result: BookingPaymentStatusResult): boolean => {
  const data = result.data as
    | {
        payment_status?: string;
        status?: string;
        payment?: { payment_status?: string; status?: string };
      }
    | undefined;
  const candidates = [
    data?.payment_status,
    data?.status,
    data?.payment?.payment_status,
    data?.payment?.status,
    result.payment?.payment_status,
    result.payment?.status,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return candidates.some((status) =>
    ["paid", "success", "completed", "settlement"].includes(status),
  );
};

const OrderCheckout = (): JSX.Element => {
  const navigate = useNavigate();
  const { studioId, packageId } = useParams<{
    studioId: string;
    packageId: string;
  }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<CheckoutFormValues>();
  const selectedPaymentMethod = Form.useWatch("payment_method", form) as
    | string
    | undefined;

  const numericStudioId = Number(studioId);
  const numericPackageId = Number(packageId);
  const selectedDate = searchParams.get("date") ?? dayjs().format("YYYY-MM-DD");
  const selectedTime = searchParams.get("time") ?? "";

  const [pkgDetail, setPkgDetail] = useState<StudioPackageDetail | null>(null);
  const [addonQty, setAddonQty] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>("");
  const [activeVouchers, setActiveVouchers] = useState<Voucher[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [trackingInvoice, setTrackingInvoice] = useState<string>("");
  const [successInvoice, setSuccessInvoice] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successActionLoading, setSuccessActionLoading] =
    useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [paymentStatusResult, setPaymentStatusResult] =
    useState<BookingPaymentStatusResult | null>(null);
  const selectedPaymentMethodLabel =
    PAYMENT_METHOD_OPTIONS.find(
      (method) => method.value === selectedPaymentMethod,
    )?.label ?? "QRIS";

  const activeAddons = useMemo(
    () =>
      (pkgDetail?.addons ?? []).filter(
        (addon) => addon.is_active === true || Number(addon.is_active) === 1,
      ),
    [pkgDetail],
  );
  const visibleAddons = useMemo(
    () => activeAddons.filter((addon) => Number(addon.price) > 0),
    [activeAddons],
  );

  const addonsTotal = useMemo(
    () =>
      activeAddons.reduce((sum, addon) => {
        const qty = addonQty[addon.id] ?? 0;
        return sum + Number(addon.price) * qty;
      }, 0),
    [activeAddons, addonQty],
  );

  const packagePrice = Number(pkgDetail?.price ?? 0);
  const beforeDiscountTotal = packagePrice + addonsTotal;
  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (beforeDiscountTotal < Number(appliedVoucher.min_total ?? 0)) return 0;

    if (appliedVoucher.discount_type === "percent") {
      const calculated =
        (beforeDiscountTotal * Number(appliedVoucher.discount_value)) / 100;
      const maxDiscount = Number(appliedVoucher.max_discount ?? calculated);
      return Math.min(calculated, maxDiscount);
    }

    return Math.min(beforeDiscountTotal, Number(appliedVoucher.discount_value));
  }, [appliedVoucher, beforeDiscountTotal]);
  const grandTotal = Math.max(0, beforeDiscountTotal - discountAmount);

  const updateAddonQty = (addonId: number, delta: number): void => {
    setAddonQty((prev) => {
      const current = prev[addonId] ?? 0;
      const nextValue = Math.max(0, current + delta);
      return { ...prev, [addonId]: nextValue };
    });
  };

  const fetchPackageDetail = async (): Promise<void> => {
    if (
      !Number.isFinite(numericStudioId) ||
      !Number.isFinite(numericPackageId)
    ) {
      setError("Studio atau paket tidak valid.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getStudioPackageDetail(
        numericStudioId,
        numericPackageId,
      );
      setPkgDetail(result);
      const initialQty = result.addons.reduce<Record<number, number>>(
        (acc, addon) => {
          acc[addon.id] = 0;
          return acc;
        },
        {},
      );
      setAddonQty(initialQty);
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil detail paket.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveVouchers = async (): Promise<void> => {
    try {
      const result = await getActiveVouchers({ page: 1, per_page: 100 });
      setActiveVouchers(result.data);
    } catch {
      setActiveVouchers([]);
    }
  };

  const applyVoucherCode = (): void => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      notification.warning({ message: "Masukkan kode voucher dulu" });
      return;
    }

    const matchedVoucher = activeVouchers.find(
      (voucher) => voucher.code.toUpperCase() === code,
    );

    if (!matchedVoucher) {
      notification.error({
        message: "Kode voucher tidak ditemukan / tidak aktif",
      });
      return;
    }

    if (Number(matchedVoucher.available_usage) <= 0) {
      notification.error({ message: "Voucher sudah habis kuota" });
      return;
    }

    if (beforeDiscountTotal < Number(matchedVoucher.min_total ?? 0)) {
      notification.warning({
        message: `Minimal transaksi ${formatCurrencyIDR(matchedVoucher.min_total)} untuk voucher ini`,
      });
      return;
    }

    setAppliedVoucher(matchedVoucher);
    notification.success({
      message: `Voucher ${matchedVoucher.code} berhasil dipakai`,
    });
  };

  const removeVoucher = (): void => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
  };

  const onSubmit = async (values: CheckoutFormValues): Promise<void> => {
    try {
      setSubmitting(true);
      if (!selectedTime) {
        notification.error({
          message: "Waktu booking belum dipilih",
          description: "Kembali ke step jadwal untuk memilih jam sesi.",
        });
        return;
      }

      const selectedAddonPayload = activeAddons
        .filter((addon) => (addonQty[addon.id] ?? 0) > 0)
        .map((addon) => ({
          addon_id: addon.id,
          qty: addonQty[addon.id],
        }));

      const payload = {
        booking_date: selectedDate,
        start_time: selectedTime,
        payment_method: values.payment_method,
        voucher_code: appliedVoucher?.code,
        customer: {
          name: values.name,
          phone: values.phone,
          email: values.email,
        },
        addons: selectedAddonPayload,
        preferences: {
          background: values.background,
          allow_social_media_upload: values.allow_social_upload,
        },
        notes: values.notes || undefined,
      };

      const result = await createOrderBooking(
        numericStudioId,
        numericPackageId,
        payload,
      );

      const paymentUrl = resolvePaymentUrl(result);
      const invoiceNumber = resolveInvoiceNumber(result);

      notification.success({
        message: "Booking berhasil dibuat",
        description:
          result.message ||
          `Booking ${pkgDetail?.name} berhasil dibuat. Lanjutkan pembayaran.`,
      });

      if (invoiceNumber) {
        setTrackingInvoice(invoiceNumber);
      }

      if (paymentUrl) {
        setPaymentUrl(paymentUrl);
        setShowPaymentModal(true);
        return;
      }

      notification.warning({
        message: "URL pembayaran tidak ditemukan",
        description:
          "Booking berhasil dibuat, tapi payment URL belum tersedia dari server.",
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal membuat booking.";
        notification.error({
          message: "Booking gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Booking gagal",
          description: "Terjadi kesalahan saat membuat booking.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      payment_method: "qris",
      background: "Putih",
      allow_social_upload: "Ngga deh",
    });
    void fetchPackageDetail();
    void fetchActiveVouchers();
  }, [studioId, packageId]);

  useEffect(() => {
    if (!trackingInvoice || showSuccessModal) return;

    const checkPaymentStatus = async (): Promise<void> => {
      try {
        const result = await getBookingPaymentStatus(trackingInvoice);
        if (!isPaymentCompleted(result)) return;

        setPaymentStatusResult(result);
        setSuccessInvoice(trackingInvoice);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setTrackingInvoice("");
        notification.success({
          message: "Pembayaran berhasil terkonfirmasi",
          description: `Invoice ${trackingInvoice} sudah selesai dibayar.`,
        });
      } catch {
        // Keep polling as fallback verification.
      }
    };

    void checkPaymentStatus();
    const timer = window.setInterval(() => {
      void checkPaymentStatus();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [trackingInvoice, showSuccessModal]);

  const handleSuccessOk = (): void => {
    setSuccessActionLoading(true);
    window.setTimeout(() => {
      setShowSuccessModal(false);
      navigate(`/order/packages?studio=${numericStudioId}`, { replace: true });
      setSuccessActionLoading(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#00bfc336_0%,#ffffff_45%),radial-gradient(circle_at_top_right,#ff227326_0%,#ffffff_45%),radial-gradient(circle_at_bottom,#ffd33b2b_0%,#ffffff_50%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <Modal
          centered
          width={980}
          title="Pembayaran Pakasir"
          open={showPaymentModal}
          onCancel={() => setShowPaymentModal(false)}
          footer={[
            <Button key="close" onClick={() => setShowPaymentModal(false)}>
              Tutup
            </Button>,
            <Button
              key="open"
              type="primary"
              icon={<ExportOutlined />}
              onClick={() =>
                window.open(paymentUrl, "_blank", "noopener,noreferrer")
              }
              disabled={!paymentUrl}
            >
              Buka di Tab Baru
            </Button>,
          ]}
        >
          <p className="mb-3 text-sm text-brand-black/70">
            Selesaikan pembayaran di bawah ini. Setelah status `paid`, halaman
            ini akan otomatis menampilkan status booking sukses.
          </p>
          {paymentUrl ? (
            <iframe
              title="Pakasir Payment"
              src={paymentUrl}
              className="h-[70vh] w-full rounded-lg border border-brand-black/10"
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Payment URL tidak tersedia"
              description="Silakan tutup modal ini dan coba submit ulang."
            />
          )}
        </Modal>

        <Modal
          centered
          title="Booking Success"
          open={showSuccessModal}
          onCancel={() => setShowSuccessModal(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              loading={successActionLoading}
              onClick={handleSuccessOk}
            >
              OK
            </Button>,
          ]}
        >
          <p className="mb-3 text-brand-black/80">
            Pembayaran berhasil. Detail booking kamu:
          </p>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Invoice">
              {successInvoice ||
                (paymentStatusResult?.payment?.order_id as
                  | string
                  | undefined) ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Paket">
              {pkgDetail?.name ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal">
              {formatDate(selectedDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Jam">
              {selectedTime || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              {formatCurrencyIDR(grandTotal)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">Paid</Descriptions.Item>
          </Descriptions>
        </Modal>

        <OrderFlowHeader
          step={4}
          backTo={`/order/studios/${numericStudioId}/packages/${numericPackageId}`}
          backLabel="Kembali ke Jadwal"
        />

        <Alert
          type="info"
          showIcon
          className="!mb-5"
          message="Ini adalah halaman terakhir. Pastikan pesanan dan data Anda terisi dengan benar."
        />

        {error ? (
          <Alert
            type="error"
            showIcon
            className="!mb-5"
            message="Error"
            description={error}
          />
        ) : null}

        {loading ? (
          <Card>
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        ) : null}

        {!loading && pkgDetail ? (
          <Form<CheckoutFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                <Card className="border !border-brand-black/10">
                  <Title level={4} className="!mb-3 !text-brand-black">
                    Detail Paket
                  </Title>
                  <div className="flex flex-col gap-3 rounded-2xl border border-brand-black/10 bg-white p-3 sm:flex-row sm:items-center">
                    <img
                      src={pkgDetail.thumbnail_url}
                      alt={pkgDetail.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div>
                      <p className="mb-1 text-lg font-semibold text-brand-black">
                        {pkgDetail.name}
                      </p>
                      <p className="mb-0 text-sm text-brand-black/70">
                        <CalendarOutlined className="mr-2 !text-brand-pink" />
                        {formatDate(selectedDate)}
                        <span className="mx-1">|</span>
                        <ClockCircleOutlined className="mr-2 !text-brand-teal" />
                        {selectedTime || "Belum memilih waktu"}
                      </p>
                    </div>
                  </div>
                </Card>

                {visibleAddons.length > 0 ? (
                  <Card className="border !border-brand-black/10">
                    <Title level={4} className="!mb-4 !text-brand-black">
                      Add-ons
                    </Title>
                    <Row gutter={[14, 14]}>
                      {visibleAddons.map((addon: PackageAddon) => {
                        const qty = addonQty[addon.id] ?? 0;
                        const subtotal = qty * Number(addon.price);

                        return (
                          <Col key={addon.id} xs={24} md={12}>
                            <div className="h-full rounded-2xl border border-brand-black/10 bg-gradient-to-br from-white to-brand-teal/5 p-4">
                              <p className="mb-1 text-lg font-semibold text-brand-black">
                                {addon.name}
                              </p>
                              <p className="mb-2 text-sm font-medium text-brand-pink">
                                {formatCurrencyIDR(addon.price)} / {addon.type}
                              </p>
                              <p className="mb-4 text-sm text-brand-black/70">
                                {addon.description || "Add-on tambahan"}
                              </p>

                              <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-white px-3 py-2">
                                <p className="mb-0 text-sm font-semibold text-brand-black">
                                  {formatCurrencyIDR(subtotal)}
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="text"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => updateAddonQty(addon.id, -1)}
                                    className="!text-brand-pink"
                                  />
                                  <span className="w-6 text-center text-sm font-semibold text-brand-black">
                                    {qty}
                                  </span>
                                  <Button
                                    type="text"
                                    icon={<PlusCircleOutlined />}
                                    onClick={() => updateAddonQty(addon.id, 1)}
                                    className="!text-brand-teal"
                                  />
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card>
                ) : null}

                <Card className="border !border-brand-black/10">
                  <Title level={4} className="!mb-1 !text-brand-black">
                    Detail Customer
                  </Title>
                  <Paragraph className="!mb-4 !text-brand-black/70">
                    Masukkan data lengkap kamu.
                  </Paragraph>

                  <Form.Item
                    name="name"
                    label="Nama"
                    rules={[{ required: true, message: "Nama wajib diisi" }]}
                  >
                    <Input placeholder="Nama lengkap" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Nomor Telepon"
                    rules={[
                      { required: true, message: "Nomor telepon wajib diisi" },
                    ]}
                  >
                    <Input placeholder="0812-1234-5678" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Email wajib diisi" },
                      { type: "email", message: "Format email tidak valid" },
                    ]}
                  >
                    <Input placeholder="emailkamu@gmail.com" />
                  </Form.Item>

                  <Title level={5} className="!mb-1 !mt-4 !text-brand-black">
                    Lain-lain
                  </Title>
                  <Paragraph className="!mb-4 !text-brand-black/70">
                    Kita butuh sedikit info tambahan.
                  </Paragraph>

                  <Form.Item
                    name="background"
                    label="Pilih background yang diinginkan"
                    rules={[
                      { required: true, message: "Background wajib dipilih" },
                    ]}
                  >
                    <Select
                      options={[
                        { value: "Putih", label: "Putih" },
                        { value: "Abu-abu", label: "Abu-abu" },
                        { value: "Pink", label: "Pink" },
                        { value: "Biru", label: "Biru" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="allow_social_upload"
                    label="Apakah boleh foto kamu diupload di sosial media?"
                    rules={[{ required: true, message: "Pilihan wajib diisi" }]}
                  >
                    <Select
                      options={[
                        { value: "Boleh", label: "Boleh" },
                        { value: "Ngga deh", label: "Ngga deh" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="notes" label="Catatan tambahan (opsional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Contoh: Datang 15 menit sebelum sesi"
                    />
                  </Form.Item>

                  <Form.Item
                    name="payment_method"
                    label="Pilih metode pembayaran"
                    rules={[{ required: true }]}
                  >
                    <Select options={PAYMENT_METHOD_OPTIONS} />
                  </Form.Item>
                </Card>
              </div>

              <div>
                <Card className="sticky top-4 border !border-brand-black/10 bg-white/95">
                  <Title level={4} className="!mb-2 !text-brand-black">
                    Detail Pembayaran
                  </Title>

                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-brand-black/80">
                      Kode Promo
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={voucherCodeInput}
                        onChange={(event) =>
                          setVoucherCodeInput(event.target.value)
                        }
                        placeholder="Masukkan kode voucher"
                        disabled={Boolean(appliedVoucher)}
                      />
                      {appliedVoucher ? (
                        <Button onClick={removeVoucher}>Hapus</Button>
                      ) : (
                        <Button type="primary" onClick={applyVoucherCode}>
                          Apply
                        </Button>
                      )}
                    </div>
                    {appliedVoucher ? (
                      <p className="mb-0 mt-2 text-xs text-brand-teal">
                        Voucher aktif: {appliedVoucher.code} (
                        {appliedVoucher.name})
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-brand-black/80">
                      <span>Metode Pembayaran</span>
                      <span className="font-semibold">
                        {selectedPaymentMethodLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-brand-black/80">
                      <span>{pkgDetail.name}</span>
                      <span className="font-semibold">
                        {formatCurrencyIDR(packagePrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-brand-black/80">
                      <span>Add-ons</span>
                      <span className="font-semibold">
                        {formatCurrencyIDR(addonsTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-brand-black/80">
                      <span>Diskon Voucher</span>
                      <span className="font-semibold text-brand-pink">
                        -{formatCurrencyIDR(discountAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 border-t border-brand-black/10 pt-3">
                    <div className="flex items-center justify-between text-lg font-bold text-brand-black">
                      <span>Total</span>
                      <span>{formatCurrencyIDR(grandTotal)}</span>
                    </div>
                  </div>

                  <ul className="mb-4 list-disc space-y-1 pl-5 text-xs text-brand-black/65">
                    <li>
                      Reschedule hanya bisa 1x dan minimal 24 jam sebelum sesi.
                    </li>
                    <li>Cancel tidak dapat refund.</li>
                    <li>
                      Keterlambatan customer dapat mengurangi durasi sesi.
                    </li>
                  </ul>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={submitting}
                    icon={<UserOutlined />}
                    className="!h-11 !border-none !bg-brand-teal !font-semibold hover:!bg-brand-pink"
                  >
                    Bayar
                  </Button>
                </Card>
              </div>
            </div>
          </Form>
        ) : null}
      </div>
    </div>
  );
};

export default OrderCheckout;
