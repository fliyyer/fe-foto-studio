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
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <OrderFlowHeader step={1} />

        <section className="mb-6 border-4 !bg-brand-teal border-brand-black  p-5 shadow-[8px_8px_0_#000] md:p-8">
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
                    className={`group overflow-hidden border-4 border-brand-black transition-all duration-200 ${
                      isSelected
                        ? "-translate-x-1 -translate-y-1 !border-brand-pink shadow-[10px_10px_0_#000]"
                        : "shadow-[8px_8px_0_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_#000]"
                    }`}
                    bodyStyle={{ padding: 18 }}
                    cover={
                      imageUrl && !imageBroken ? (
                        <div className="relative h-72 overflow-hidden border-b-4 border-brand-black">
                          <img
                            src={imageUrl}
                            alt={studio.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                            onError={() =>
                              setBrokenImages((prev) => ({
                                ...prev,
                                [studio.id]: true,
                              }))
                            }
                          />
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <Tag
                              color="#00bfc3"
                              className="!m-0 !border-brand-black !font-bold"
                            >
                              {studio.city}
                            </Tag>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-72 items-center justify-center border-b-4 border-brand-black bg-brand-teal/25">
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
                    <Paragraph className="!mb-4 !text-brand-black/70">
                      <EnvironmentOutlined className="mr-2 !text-brand-pink" />
                      {studio.address}
                    </Paragraph>

                    <div className="flex items-center justify-between border-2 border-brand-black bg-brand-yellow px-3 py-2">
                      <div className="text-sm font-semibold text-brand-black/90">
                        <FieldTimeOutlined className="mr-2 !text-brand-teal" />
                        {formatTime(studio.open_time)} -{" "}
                        {formatTime(studio.close_time)}
                      </div>
                      {isSelected ? (
                        <Tag
                          color="#ff2273"
                          className="!border-2 !border-brand-black !font-bold"
                        >
                          Dipilih
                        </Tag>
                      ) : null}
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
              className="!h-11 !border-none !bg-brand-yellow !text-brand-black !px-6 !font-semibold hover:!bg-brand-pink hover:!text-white"
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
