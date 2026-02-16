import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Typography,
  notification,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useParams, useSearchParams } from "react-router-dom";
import OrderFlowHeader from "../components/OrderFlowHeader";
import {
  getStudioPackageDetail,
  type PackageAddon,
  type StudioPackageDetail,
} from "../services/package.service";

const { Title, Paragraph } = Typography;

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

const OrderCheckout = (): JSX.Element => {
  const { studioId, packageId } = useParams<{
    studioId: string;
    packageId: string;
  }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<CheckoutFormValues>();

  const numericStudioId = Number(studioId);
  const numericPackageId = Number(packageId);
  const selectedDate = searchParams.get("date") ?? dayjs().format("YYYY-MM-DD");
  const selectedTime = searchParams.get("time") ?? "";

  const [pkgDetail, setPkgDetail] = useState<StudioPackageDetail | null>(null);
  const [addonQty, setAddonQty] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

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
  const grandTotal = packagePrice + addonsTotal;

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

  const onSubmit = async (values: CheckoutFormValues): Promise<void> => {
    try {
      setSubmitting(true);
      const selectedAddonPayload = activeAddons
        .filter((addon) => (addonQty[addon.id] ?? 0) > 0)
        .map((addon) => ({
          addon_id: addon.id,
          qty: addonQty[addon.id],
        }));

      notification.success({
        message: "Data order siap",
        description: `Checkout siap dikirim. Paket: ${pkgDetail?.name}, Add-ons: ${selectedAddonPayload.length}, Total: ${formatCurrencyIDR(grandTotal)}.`,
      });

      console.log("Checkout payload preview", {
        studio_id: numericStudioId,
        package_id: numericPackageId,
        booking_date: selectedDate,
        start_time: selectedTime,
        addons: selectedAddonPayload,
        customer: values,
      });
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
  }, [studioId, packageId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#00bfc336_0%,#ffffff_45%),radial-gradient(circle_at_top_right,#ff227326_0%,#ffffff_45%),radial-gradient(circle_at_bottom,#ffd33b2b_0%,#ffffff_50%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
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
                    <Select options={[{ value: "qris", label: "QRIS" }]} />
                  </Form.Item>
                </Card>
              </div>

              <div>
                <Card className="sticky top-4 border !border-brand-black/10 bg-white/95">
                  <Title level={4} className="!mb-2 !text-brand-black">
                    Detail Pembayaran
                  </Title>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-brand-black/80">
                      <span>Metode Pembayaran</span>
                      <span className="font-semibold">QRIS</span>
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
