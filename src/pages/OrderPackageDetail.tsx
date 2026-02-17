import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileImageOutlined,
  PrinterOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/id";
import { useNavigate, useParams } from "react-router-dom";
import OrderFlowHeader from "../components/OrderFlowHeader";
import {
  getPackageAvailableSlots,
  getStudioPackageDetail,
  type AvailableSlot,
  type StudioPackageDetail,
} from "../services/package.service";

const { Title, Paragraph } = Typography;

const formatCurrencyIDR = (value: number | string): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDateLabel = (value: string): string =>
  dayjs(value).locale("id").format("D MMMM YYYY");

const OrderPackageDetail = (): JSX.Element => {
  const navigate = useNavigate();
  const { studioId, packageId } = useParams<{
    studioId: string;
    packageId: string;
  }>();

  const numericStudioId = Number(studioId);
  const numericPackageId = Number(packageId);

  const [pkgDetail, setPkgDetail] = useState<StudioPackageDetail | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [imageBroken, setImageBroken] = useState<boolean>(false);

  const onChangeDate = (value: Dayjs | null): void => {
    if (!value) return;
    setSelectedDate(value.format("YYYY-MM-DD"));
    setSelectedSlot(null);
  };

  const fetchPackageDetail = async (): Promise<void> => {
    if (
      !Number.isFinite(numericStudioId) ||
      !Number.isFinite(numericPackageId)
    ) {
      setError("Studio atau paket tidak valid.");
      setLoadingDetail(false);
      return;
    }

    try {
      setLoadingDetail(true);
      setError("");
      const result = await getStudioPackageDetail(
        numericStudioId,
        numericPackageId,
      );
      setPkgDetail(result);
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil detail paket.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchSlots = async (): Promise<void> => {
    if (
      !Number.isFinite(numericStudioId) ||
      !Number.isFinite(numericPackageId)
    ) {
      setLoadingSlots(false);
      return;
    }

    try {
      setLoadingSlots(true);
      setError("");
      const result = await getPackageAvailableSlots(
        numericStudioId,
        numericPackageId,
        selectedDate,
      );
      setSlots(result.slots);
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil slot waktu.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onContinue = (): void => {
    if (!pkgDetail || !selectedSlot) return;
    navigate(
      `/order/studios/${numericStudioId}/packages/${numericPackageId}/checkout?date=${selectedDate}&time=${selectedSlot.start_time}`,
    );
  };

  useEffect(() => {
    void fetchPackageDetail();
  }, [studioId, packageId]);

  useEffect(() => {
    void fetchSlots();
  }, [studioId, packageId, selectedDate]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <OrderFlowHeader
          step={3}
          backTo={`/order/packages?studio=${numericStudioId}`}
          backLabel="Kembali ke Pilih Paket"
        />

        {error ? (
          <Alert
            type="error"
            showIcon
            className="!mb-5"
            message="Terjadi kesalahan"
            description={error}
          />
        ) : null}

        {loadingDetail ? (
          <Card>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        ) : null}

        {!loadingDetail && pkgDetail ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_0.8fr] lg:items-start">
            <Card className="overflow-hidden border !border-brand-black/10">
              {pkgDetail.thumbnail_url && !imageBroken ? (
                <img
                  src={pkgDetail.thumbnail_url}
                  alt={pkgDetail.name}
                  className="mb-4 h-72 w-full rounded-2xl object-cover"
                  onError={() => setImageBroken(true)}
                />
              ) : (
                <div className="mb-4 flex h-72 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal/25 via-white to-brand-pink/20">
                  <span className="px-4 text-center text-2xl font-bold text-brand-black">
                    {pkgDetail.name}
                  </span>
                </div>
              )}

              <Tag color="#00bfc3" className="!mb-2 !font-semibold">
                {pkgDetail.category}
              </Tag>
              <Title level={3} className="!mb-2 !text-brand-black">
                {pkgDetail.name}
              </Title>
              <Paragraph className="!mb-4 !text-brand-black/70">
                {pkgDetail.description ||
                  "Paket foto studio dengan kualitas terbaik."}
              </Paragraph>

              <div className="mb-4 space-y-1 rounded-xl bg-brand-yellow/25 p-3 text-sm text-brand-black/80">
                <p className="mb-0 flex items-center gap-2">
                  <TeamOutlined className="!text-brand-pink" /> Max{" "}
                  {pkgDetail.max_person} orang
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <ClockCircleOutlined className="!text-brand-teal" />{" "}
                  {pkgDetail.duration_minutes} menit sesi
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <PrinterOutlined className="!text-brand-black/70" />
                  Free 1 print / session
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <FileImageOutlined className="!text-brand-black/70" />
                  Free ALl Soft File
                </p>
              </div>
            </Card>

            <Card className="border !border-brand-black/10">
              <Title level={4} className="!mb-3 !text-brand-black">
                Pilih tanggal dan waktu
              </Title>

              <DatePicker
                value={dayjs(selectedDate)}
                onChange={onChangeDate}
                format="DD MMMM YYYY"
                allowClear={false}
                className="!mb-4 !w-full"
                disabledDate={(current) =>
                  current.isBefore(dayjs().startOf("day"))
                }
              />

              {loadingSlots ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : slots.length === 0 ? (
                <Empty description="Slot belum tersedia" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time &&
                      selectedSlot?.end_time === slot.end_time;

                    return (
                      <Button
                        key={`${slot.start_time}-${slot.end_time}`}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.is_available}
                        className={`!h-11 !rounded-xl !font-semibold ${
                          isSelected
                            ? "!border-none !bg-brand-teal !text-white hover:!bg-brand-pink"
                            : slot.is_available
                              ? "!border-brand-black/20 !text-brand-black hover:!border-brand-teal hover:!text-brand-teal"
                              : "!border-none !bg-brand-black/15 !text-brand-black/40"
                        }`}
                      >
                        {slot.start_time}
                      </Button>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="sticky top-4 border !border-brand-black/10 bg-white/95">
              <Title level={5} className="!mb-2 !text-brand-black">
                Tanggal & Waktu dipilih
              </Title>
              <p className="mb-1 text-sm text-brand-black/75">
                <CalendarOutlined className="mr-2 !text-brand-pink" />
                {formatDateLabel(selectedDate)}
              </p>
              <p className="mb-4 text-sm text-brand-black/75">
                <ClockCircleOutlined className="mr-2 !text-brand-teal" />
                {selectedSlot
                  ? `${selectedSlot.start_time} - ${selectedSlot.end_time}`
                  : "Belum memilih waktu"}
              </p>

              <div className="mb-4 rounded-xl border border-brand-black/10 bg-brand-yellow/25 px-3 py-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-brand-black/60">
                  Harga Paket
                </p>
                <p className="mb-0 text-lg font-bold text-brand-black">
                  {formatCurrencyIDR(pkgDetail.price)}
                </p>
              </div>

              <Button
                type="primary"
                block
                size="large"
                icon={<CheckCircleOutlined />}
                disabled={!selectedSlot}
                onClick={onContinue}
                className="!h-11 !border-none !bg-brand-yellow !text-brand-black font-semibold hover:!bg-brand-pink hover:!text-white"
              >
                Selanjutnya
              </Button>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderPackageDetail;
