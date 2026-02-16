import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  EnvironmentOutlined,
  FieldTimeOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import OrderFlowHeader from "../components/OrderFlowHeader";
import { getStudios, type Studio } from "../services/studio.service";

const { Title, Paragraph } = Typography;

const formatTime = (value: string): string => value.slice(0, 5);

// Public order page: users pick a studio first, no authentication required.
const OrderStudioSelection = (): JSX.Element => {
  const navigate = useNavigate();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  const selectedStudio = useMemo(
    () => studios.find((studio) => studio.id === selectedStudioId) ?? null,
    [studios, selectedStudioId],
  );

  const fetchStudios = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const result = await getStudios();
      setStudios(result);
      setSelectedStudioId((prev) => prev ?? result[0]?.id ?? null);
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil data studio.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = (): void => {
    if (!selectedStudio) return;
    navigate(`/order/packages?studio=${selectedStudio.id}`);
  };

  useEffect(() => {
    void fetchStudios();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#00bfc336_0%,#ffffff_45%),radial-gradient(circle_at_top_right,#ff227326_0%,#ffffff_40%),radial-gradient(circle_at_bottom,#ffd33b2b_0%,#ffffff_45%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <OrderFlowHeader step={1} />

        <section className="mb-6 rounded-3xl border border-brand-black/10 bg-gradient-to-r from-brand-teal/20 via-white to-brand-yellow/25 p-5 md:p-8">
          <Title level={2} className="!mb-2 !text-brand-black">
            Pilih Studio Favoritmu
          </Title>
          <Paragraph className="!mb-0 !text-brand-black/70">
            Pilih lokasi studio terlebih dahulu sebelum memilih paket foto dan
            jadwal booking.
          </Paragraph>
        </section>

        {error ? (
          <Alert
            type="error"
            showIcon
            className="!mb-5"
            message="Gagal memuat studio"
            description={error}
            action={
              <Button onClick={() => void fetchStudios()}>Coba Lagi</Button>
            }
          />
        ) : null}

        {loading ? (
          <Row gutter={[18, 18]}>
            {[1, 2, 3].map((value) => (
              <Col key={value} xs={24} md={12} lg={8}>
                <Card className="overflow-hidden">
                  <Skeleton.Image active className="!h-[220px] !w-full" />
                  <Skeleton active paragraph={{ rows: 3 }} className="mt-4" />
                </Card>
              </Col>
            ))}
          </Row>
        ) : null}

        {!loading && !error && studios.length === 0 ? (
          <Card>
            <Empty description="Belum ada studio tersedia" />
          </Card>
        ) : null}

        {!loading && !error && studios.length > 0 ? (
          <Row gutter={[18, 18]}>
            {studios.map((studio) => {
              const isSelected = selectedStudioId === studio.id;
              const imageUrl = studio.thumbnail_url;
              const imageBroken = brokenImages[studio.id];

              return (
                <Col key={studio.id} xs={24} md={12} lg={8}>
                  <Card
                    hoverable
                    onClick={() => setSelectedStudioId(studio.id)}
                    className={`group overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "-translate-y-1 border-2 !border-brand-pink shadow-[0_18px_40px_rgba(255,34,115,0.24)]"
                        : "border !border-brand-black/10 hover:-translate-y-1 hover:!border-brand-teal/60 hover:shadow-[0_14px_34px_rgba(0,191,195,0.20)]"
                    }`}
                    bodyStyle={{ padding: 16 }}
                    cover={
                      imageUrl && !imageBroken ? (
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={studio.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={() =>
                              setBrokenImages((prev) => ({
                                ...prev,
                                [studio.id]: true,
                              }))
                            }
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                            <Tag
                              color="#00bfc3"
                              className="!m-0 !font-semibold"
                            >
                              {studio.city}
                            </Tag>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-brand-teal/25 via-white to-brand-pink/20">
                          <span className="text-xl font-bold text-brand-black">
                            {studio.name}
                          </span>
                        </div>
                      )
                    }
                  >
                    <Title level={4} className="!mb-1 !text-brand-black">
                      {studio.name}
                    </Title>
                    <Paragraph className="!mb-3 !text-brand-black/70">
                      <EnvironmentOutlined className="mr-2 !text-brand-pink" />
                      {studio.address}
                    </Paragraph>

                    <div className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-yellow/30 px-3 py-2">
                      <div className="text-sm text-brand-black/80">
                        <FieldTimeOutlined className="mr-2 !text-brand-teal" />
                        {formatTime(studio.open_time)} -{" "}
                        {formatTime(studio.close_time)}
                      </div>
                      {isSelected ? <Tag color="#ff2273">Dipilih</Tag> : null}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : null}

        <div className="sticky bottom-4 mt-7 rounded-2xl border border-brand-black/10 bg-white/95 p-4 shadow-lg backdrop-blur md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold text-brand-black">
                Studio terpilih
              </p>
              <p className="mb-0 text-sm text-brand-black/70">
                {selectedStudio
                  ? `${selectedStudio.name} - ${selectedStudio.city}`
                  : "Silakan pilih salah satu studio terlebih dahulu."}
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={handleContinue}
              disabled={!selectedStudio}
              className="!h-11 !border-none !bg-brand-teal !px-6 !font-semibold hover:!bg-brand-pink"
            >
              Lanjut Pilih Paket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStudioSelection;
