import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileImageOutlined,
  PrinterOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import OrderFlowHeader from "../components/OrderFlowHeader";
import {
  getStudioPackages,
  type StudioPackage,
} from "../services/package.service";
import { getStudios, type Studio } from "../services/studio.service";

const { Title, Paragraph, Text } = Typography;

const formatCurrencyIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const OrderPackageSelection = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const [loadingStudios, setLoadingStudios] = useState<boolean>(true);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  const selectedStudio = useMemo(
    () => studios.find((studio) => studio.id === selectedStudioId) ?? null,
    [studios, selectedStudioId],
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(packages.map((item) => item.category).filter(Boolean)),
    );
    return ["All", ...unique];
  }, [packages]);

  const filteredPackages = useMemo(() => {
    if (activeCategory === "All") return packages;
    return packages.filter((item) => item.category === activeCategory);
  }, [activeCategory, packages]);

  const fetchStudios = async (): Promise<void> => {
    try {
      setLoadingStudios(true);
      setError("");
      const result = await getStudios();
      setStudios(result);

      const studioFromQuery = Number(searchParams.get("studio"));
      const hasQuery = Number.isFinite(studioFromQuery) && studioFromQuery > 0;
      const initialStudio =
        hasQuery && result.some((item) => item.id === studioFromQuery)
          ? studioFromQuery
          : result[0]?.id;

      setSelectedStudioId(initialStudio ?? null);

      if (initialStudio) {
        setSearchParams({ studio: String(initialStudio) }, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil data studio.");
    } finally {
      setLoadingStudios(false);
    }
  };

  const fetchPackages = async (studioId: number): Promise<void> => {
    try {
      setLoadingPackages(true);
      setError("");
      const result = await getStudioPackages(studioId);
      const activeList = result.filter(
        (item) => Number(item.is_active) === 1 || item.is_active === true,
      );
      setPackages(activeList);
      setActiveCategory("All");
    } catch (err) {
      setError((err as Error).message || "Gagal mengambil data paket.");
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const onChangeStudio = (studioId: number): void => {
    setSelectedStudioId(studioId);
    setSearchParams({ studio: String(studioId) }, { replace: true });
  };

  const onSelectPackage = (pkg: StudioPackage): void => {
    if (!selectedStudioId) return;
    navigate(`/order/studios/${selectedStudioId}/packages/${pkg.id}`);
  };

  useEffect(() => {
    void fetchStudios();
  }, []);

  useEffect(() => {
    if (!selectedStudioId) {
      setLoadingPackages(false);
      return;
    }
    void fetchPackages(selectedStudioId);
  }, [selectedStudioId]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <OrderFlowHeader step={2} backTo="/" backLabel="Ganti Studio" />

        <section className="mb-6 bg-brand-teal border-4 border-brand-black shadow-[8px_8px_0_#000] p-5 md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <Title level={2} className="!mb-2 !text-brand-black">
                Pilih Paket Foto
              </Title>
              <Paragraph className="!mb-2 !text-brand-black/70">
                Pilih paket yang paling cocok untuk sesi fotomu.
              </Paragraph>
              <Text className="!text-brand-black/75">
                Kamu memilih studio:{" "}
                <span className="font-semibold">
                  {selectedStudio?.name ?? "-"}
                </span>
              </Text>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-black">
                Lokasi <span className="text-brand-pink">*</span>
              </p>
              <Select
                value={selectedStudioId ?? undefined}
                onChange={onChangeStudio}
                loading={loadingStudios}
                className="w-full"
                placeholder="Pilih studio"
                options={studios.map((studio) => ({
                  value: studio.id,
                  label: `${studio.name} - ${studio.address}`,
                }))}
              />
            </div>
          </div>
        </section>

        {error ? (
          <Alert
            type="error"
            showIcon
            className="!mb-5"
            message="Gagal memuat paket"
            description={error}
            action={
              selectedStudioId ? (
                <Button onClick={() => void fetchPackages(selectedStudioId)}>
                  Coba Lagi
                </Button>
              ) : undefined
            }
          />
        ) : null}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              type={category === activeCategory ? "primary" : "default"}
              onClick={() => setActiveCategory(category)}
              className={
                category === activeCategory
                  ? "!border-none !bg-brand-teal hover:!bg-brand-pink"
                  : "!border-brand-black/20 !text-brand-black"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {loadingPackages ? (
          <Row gutter={[18, 18]}>
            {[1, 2, 3].map((value) => (
              <Col key={value} xs={24} md={12} xl={8}>
                <Card className="overflow-hidden">
                  <Skeleton.Image active className="!h-[220px] !w-full" />
                  <Skeleton active paragraph={{ rows: 5 }} className="mt-4" />
                </Card>
              </Col>
            ))}
          </Row>
        ) : null}

        {!loadingPackages && filteredPackages.length === 0 ? (
          <Card>
            <Empty description="Paket belum tersedia untuk studio ini" />
          </Card>
        ) : null}

        {!loadingPackages && filteredPackages.length > 0 ? (
          <Row gutter={[18, 18]}>
            {filteredPackages.map((pkg) => {
              const imageBroken = brokenImages[pkg.id];

              return (
                <Col key={pkg.id} xs={24} md={12} xl={8}>
                  <Card
                    className="group h-full overflow-hidden border-4 border-brand-black transition-all duration-200 shadow-[8px_8px_0_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_#000]"
                    bodyStyle={{ padding: 18 }}
                    cover={
                      pkg.thumbnail_url && !imageBroken ? (
                        <div className="relative h-72 overflow-hidden border-b-4 border-brand-black bg-brand-black">
                          <img
                            src={pkg.thumbnail_url}
                            alt={pkg.name}
                            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-110"
                            onError={() =>
                              setBrokenImages((prev) => ({
                                ...prev,
                                [pkg.id]: true,
                              }))
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex h-72 items-center justify-center border-b-4 border-brand-black bg-brand-teal/20">
                          <span className="px-4 text-center text-xl font-bold text-brand-black">
                            {pkg.name}
                          </span>
                        </div>
                      )
                    }
                  >
                    <Tag
                      color="#00bfc3"
                      className="!mb-2 !border-2 !border-brand-black !font-bold"
                    >
                      {pkg.category}
                    </Tag>

                    <Title level={4} className="!mb-2 !text-brand-black">
                      {pkg.name}
                    </Title>

                    <div className="mb-3 space-y-1 border-2 border-brand-black bg-brand-yellow/30 p-3 text-sm text-brand-black/90">
                      <p className="mb-0 flex items-center gap-2">
                        <TeamOutlined className="!text-brand-pink" />
                        Max {pkg.max_person} orang
                      </p>
                      <p className="mb-0 flex items-center gap-2">
                        <ClockCircleOutlined className="!text-brand-teal" />
                        {pkg.duration_minutes} menit sesi foto
                      </p>
                      <p className="mb-0 flex items-center gap-2">
                        <PrinterOutlined className="!text-brand-black/70" />
                        Free 1 print / session
                      </p>
                      <p className="mb-0 flex items-center gap-2">
                        <FileImageOutlined className="!text-brand-black/70" />
                        Free ALL Soft File
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="mb-1 text-sm font-semibold text-brand-black">
                        {formatCurrencyIDR(pkg.price)}
                      </p>
                      <Paragraph
                        className="!mb-0 !text-brand-black/65"
                        ellipsis={{ rows: 2 }}
                      >
                        {pkg.description ||
                          "Paket foto profesional dengan kualitas studio terbaik."}
                      </Paragraph>
                    </div>

                    <Button
                      type="primary"
                      block
                      icon={<CheckCircleOutlined />}
                      onClick={() => onSelectPackage(pkg)}
                      className="!h-10 !border-2 !border-brand-black !bg-brand-yellow !text-black !font-extrabold shadow-[4px_4px_0_#000] hover:!bg-brand-pink hover:!text-white"
                    >
                      Pilih Paket
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : null}
      </div>
    </div>
  );
};

export default OrderPackageSelection;
