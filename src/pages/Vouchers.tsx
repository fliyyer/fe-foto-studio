import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  notification,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
  TagOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  createVoucher,
  getActiveVouchers,
  type CreateVoucherPayload,
  type Voucher,
} from "../services/voucher.service";
import { clearAuthSession } from "../utils/auth";

const { Title, Paragraph, Text } = Typography;

interface VoucherFormValues {
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_total: number;
  usage_limit: number;
  is_active: boolean;
}

const formatCurrencyIDR = (value: number | string | null): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const Vouchers = (): JSX.Element => {
  const navigate = useNavigate();
  const [form] = Form.useForm<VoucherFormValues>();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [total, setTotal] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleUnauthorized = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const fetchVouchers = async (
    nextPage = page,
    nextPerPage = perPage,
  ): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const result = await getActiveVouchers({
        page: nextPage,
        per_page: nextPerPage,
      });

      setVouchers(result.data);
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
          "Gagal mengambil data voucher.";
        setError(apiMessage);
      } else {
        setError("Terjadi kesalahan saat mengambil data voucher.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      notification.success({ message: `Kode ${code} berhasil disalin` });
    } catch {
      notification.error({ message: "Gagal menyalin kode voucher" });
    }
  };

  const openModal = (): void => {
    form.setFieldsValue({
      discount_type: "percent",
      max_discount: 50000,
      min_total: 100000,
      usage_limit: 100,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onCreateVoucher = async (values: VoucherFormValues): Promise<void> => {
    try {
      setIsSubmitting(true);

      const payload: CreateVoucherPayload = {
        ...values,
        max_discount:
          values.discount_type === "percent"
            ? (values.max_discount ?? 0)
            : null,
      };

      await createVoucher(payload);
      notification.success({ message: "Voucher berhasil dibuat" });
      closeModal();
      await fetchVouchers(1, perPage);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        notification.error({
          message: "Gagal membuat voucher",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat membuat voucher.",
        });
      } else {
        notification.error({
          message: "Gagal membuat voucher",
          description: "Terjadi kesalahan saat membuat voucher.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTableChange = (pagination: TablePaginationConfig): void => {
    void fetchVouchers(pagination.current ?? 1, pagination.pageSize ?? perPage);
  };

  const totalAvailableUsage = useMemo(
    () =>
      vouchers.reduce(
        (sum, voucher) => sum + Number(voucher.available_usage || 0),
        0,
      ),
    [vouchers],
  );

  const columns: ColumnsType<Voucher> = [
    {
      title: "Kode Voucher",
      key: "code",
      width: 220,
      render: (_, record) => (
        <Space>
          <Text code>{record.code}</Text>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => void copyCode(record.code)}
          >
            Copy
          </Button>
        </Space>
      ),
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      width: 220,
    },
    {
      title: "Diskon",
      key: "discount",
      width: 160,
      render: (_, record) =>
        record.discount_type === "percent"
          ? `${record.discount_value}%`
          : formatCurrencyIDR(record.discount_value),
    },
    {
      title: "Syarat",
      key: "requirement",
      width: 260,
      render: (_, record) => (
        <div>
          <p className="mb-0 text-sm text-brand-black/80">
            Min. total: {formatCurrencyIDR(record.min_total)}
          </p>
          <p className="mb-0 text-xs text-brand-black/60">
            Max discount: {formatCurrencyIDR(record.max_discount)}
          </p>
        </div>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      width: 180,
      render: (_, record) => (
        <div>
          <Tag color="#00bfc3">Sisa: {record.available_usage}</Tag>
          <p className="mb-0 mt-1 text-xs text-brand-black/60">
            {record.total_usage} / {record.usage_limit} digunakan
          </p>
        </div>
      ),
    },
  ];

  useEffect(() => {
    void fetchVouchers(1, perPage);
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-brand-black">
            Vouchers
          </Title>
          <Paragraph className="!mb-0 !text-brand-black/70">
            Kelola voucher promo dan salin kode voucher secara cepat.
          </Paragraph>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void fetchVouchers(page, perPage)}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            className="bg-brand-yellow text-black hover:!bg-brand-pink"
            icon={<PlusOutlined />}
            onClick={openModal}
          >
            Add Voucher
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Active Voucher (Page)"
              value={vouchers.length}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Total Active Voucher" value={total} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Sisa Kuota (Page)" value={totalAvailableUsage} />
          </Card>
        </Col>
      </Row>

      {error ? (
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="Voucher error"
          description={error}
        />
      ) : null}

      <Card className="border !border-brand-black/10">
        <Table<Voucher>
          rowKey="id"
          columns={columns}
          dataSource={vouchers}
          loading={loading}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize: perPage,
            total,
            showSizeChanger: true,
          }}
          onChange={onTableChange}
        />
      </Card>

      <Modal
        title="Tambah Voucher"
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Simpan"
        centered
        confirmLoading={isSubmitting}
      >
        <Form<VoucherFormValues>
          form={form}
          layout="vertical"
          onFinish={onCreateVoucher}
        >
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: "Kode wajib diisi" }]}
          >
            <Input placeholder="PROMO10" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Nama voucher wajib diisi" }]}
          >
            <Input placeholder="Diskon 10%" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="discount_type"
                label="Discount Type"
                rules={[{ required: true, message: "Pilih tipe diskon" }]}
              >
                <Select
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "fixed", label: "Fixed" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount_value"
                label="Discount Value"
                rules={[
                  { required: true, message: "Nilai diskon wajib diisi" },
                ]}
              >
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="max_discount" label="Max Discount">
                <InputNumber className="!w-full" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="min_total"
                label="Min Total"
                rules={[{ required: true, message: "Min total wajib diisi" }]}
              >
                <InputNumber className="!w-full" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="usage_limit"
                label="Usage Limit"
                rules={[{ required: true, message: "Usage limit wajib diisi" }]}
              >
                <InputNumber className="!w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                rules={[{ required: true, message: "Status wajib dipilih" }]}
              >
                <Select
                  options={[
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Vouchers;
