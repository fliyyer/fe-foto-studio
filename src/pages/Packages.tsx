import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShopOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  createStudioPackage,
  deleteStudioPackage,
  getStudioPackages,
  type StudioPackage,
  updateStudioPackage,
} from "../services/package.service";
import { getStudios, type Studio } from "../services/studio.service";
import { clearAuthSession } from "../utils/auth";

const { Title, Paragraph } = Typography;

interface PackageFormValues {
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  slot_duration: number;
  max_booking_per_slot: number;
  description: string;
  background: string;
  max_person: number;
  is_active: 1 | 0;
}

const currencyIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const PACKAGE_CATEGORY_OPTIONS = [
  { label: "Self Photo", value: "Self Photo" },
  { label: "Photobooth", value: "Photobooth" },
];

// Packages page: select a studio first, then manage packages for that studio.
const Packages = (): JSX.Element => {
  const navigate = useNavigate();
  const [form] = Form.useForm<PackageFormValues>();
  const [editForm] = Form.useForm<PackageFormValues>();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [loadingStudios, setLoadingStudios] = useState<boolean>(true);
  const [studioError, setStudioError] = useState<string>("");

  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [packagesError, setPackagesError] = useState<string>("");
  const [packageListSupported, setPackageListSupported] =
    useState<boolean>(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<StudioPackage | null>(
    null,
  );
  const [editUploadFiles, setEditUploadFiles] = useState<UploadFile[]>([]);
  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(
    null,
  );

  const selectedStudio = useMemo(
    () => studios.find((studio) => studio.id === selectedStudioId) ?? null,
    [studios, selectedStudioId],
  );

  const handleUnauthorized = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const fetchStudios = async (): Promise<void> => {
    try {
      setLoadingStudios(true);
      setStudioError("");
      const result = await getStudios();
      setStudios(result);
      setSelectedStudioId((prev) => {
        if (prev && result.some((studio) => studio.id === prev)) return prev;
        return result[0]?.id ?? null;
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengambil daftar studio.";
        setStudioError(apiMessage);
      } else {
        setStudioError("Terjadi kesalahan saat mengambil daftar studio.");
      }
    } finally {
      setLoadingStudios(false);
    }
  };

  const fetchPackages = async (studioId: number): Promise<void> => {
    try {
      setLoadingPackages(true);
      setPackagesError("");
      const result = await getStudioPackages(studioId);
      setPackages(result);
      setPackageListSupported(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        // If list endpoint isn't available yet, keep create flow available.
        if (err.response?.status === 404 || err.response?.status === 405) {
          setPackages([]);
          setPackageListSupported(false);
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengambil daftar paket.";
        setPackagesError(apiMessage);
      } else {
        setPackagesError("Terjadi kesalahan saat mengambil daftar paket.");
      }
    } finally {
      setLoadingPackages(false);
    }
  };

  const closeAddModal = (): void => {
    setIsAddModalOpen(false);
    form.resetFields();
    setUploadFiles([]);
  };

  const closeEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingPackage(null);
    editForm.resetFields();
    setEditUploadFiles([]);
  };

  const handleCreatePackage = async (
    values: PackageFormValues,
  ): Promise<void> => {
    if (!selectedStudioId) {
      notification.error({
        message: "Pilih studio dulu",
        description: "Paket harus terhubung dengan studio.",
      });
      return;
    }

    const selectedFile = uploadFiles[0]?.originFileObj;
    if (!selectedFile) {
      notification.error({
        message: "Thumbnail wajib diisi",
        description: "Silakan upload thumbnail paket.",
      });
      return;
    }

    try {
      setIsCreating(true);
      await createStudioPackage(selectedStudioId, {
        ...values,
        is_active: values.is_active === 1,
        thumbnail: selectedFile as File,
      });
      notification.success({
        message: "Paket berhasil ditambahkan",
      });
      closeAddModal();
      await fetchPackages(selectedStudioId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal menambahkan paket.";
        notification.error({
          message: "Add paket gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Add paket gagal",
          description: "Terjadi kesalahan saat menambahkan paket.",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (pkg: StudioPackage): void => {
    setEditingPackage(pkg);
    editForm.setFieldsValue({
      name: pkg.name,
      category: pkg.category,
      price: pkg.price,
      duration_minutes: pkg.duration_minutes,
      slot_duration: pkg.slot_duration,
      max_booking_per_slot: pkg.max_booking_per_slot,
      description: pkg.description ?? "",
      background: pkg.background ?? "",
      max_person: pkg.max_person,
      is_active: Number(pkg.is_active) === 1 ? 1 : 0,
    });
    setEditUploadFiles([]);
    setIsEditModalOpen(true);
  };

  const handleUpdatePackage = async (
    values: PackageFormValues,
  ): Promise<void> => {
    if (!selectedStudioId || !editingPackage) return;

    try {
      setIsUpdating(true);
      await updateStudioPackage(selectedStudioId, editingPackage.id, {
        ...values,
        is_active: values.is_active === 1,
        thumbnail: editUploadFiles[0]?.originFileObj as File | undefined,
      });
      notification.success({
        message: "Paket berhasil diupdate",
      });
      closeEditModal();
      await fetchPackages(selectedStudioId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengupdate paket.";
        notification.error({
          message: "Edit paket gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Edit paket gagal",
          description: "Terjadi kesalahan saat mengupdate paket.",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: "image/*",
    beforeUpload: () => false,
    maxCount: 1,
    fileList: uploadFiles,
    onChange: ({ fileList }) => setUploadFiles(fileList.slice(-1)),
  };

  const editUploadProps: UploadProps = {
    accept: "image/*",
    beforeUpload: () => false,
    maxCount: 1,
    fileList: editUploadFiles,
    onChange: ({ fileList }) => setEditUploadFiles(fileList.slice(-1)),
  };

  const handleDeletePackage = async (pkg: StudioPackage): Promise<void> => {
    if (!selectedStudioId) return;

    try {
      setDeletingPackageId(pkg.id);
      await deleteStudioPackage(selectedStudioId, pkg.id);
      notification.success({
        message: "Paket berhasil dihapus",
      });
      await fetchPackages(selectedStudioId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal menghapus paket.";
        notification.error({
          message: "Delete paket gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Delete paket gagal",
          description: "Terjadi kesalahan saat menghapus paket.",
        });
      }
    } finally {
      setDeletingPackageId(null);
    }
  };

  useEffect(() => {
    void fetchStudios();
  }, []);

  useEffect(() => {
    if (!selectedStudioId) return;
    void fetchPackages(selectedStudioId);
  }, [selectedStudioId]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-brand-black">
            Packages
          </Title>
          <Paragraph className="!mb-0 !text-brand-black/70">
            Pilih studio terlebih dahulu, lalu tambahkan paket berdasarkan
            studio tersebut.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchStudios()}>
            Refresh Studios
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-brand-yellow text-black hover:!bg-brand-pink"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!selectedStudioId}
          >
            Add Package
          </Button>
        </Space>
      </div>

      <Modal
        width={750}
        title={`Tambah Paket${selectedStudio ? ` - ${selectedStudio.name}` : ""}`}
        open={isAddModalOpen}
        onCancel={closeAddModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        okText="Simpan"
      >
        <Form<PackageFormValues>
          layout="vertical"
          form={form}
          onFinish={handleCreatePackage}
          initialValues={{
            is_active: 1,
            slot_duration: 1,
            max_booking_per_slot: 1,
            max_person: 1,
            background: "",
          }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama paket wajib diisi" }]}
          >
            <Input placeholder="Paket Self Photo" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Kategori wajib diisi" }]}
            >
              <Select
                placeholder="Pilih kategori"
                options={PACKAGE_CATEGORY_OPTIONS}
              />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Harga wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={0} placeholder="25000" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Duration (minutes)"
              name="duration_minutes"
              rules={[{ required: true, message: "Durasi wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
            <Form.Item
              label="Slot Duration"
              name="slot_duration"
              rules={[{ required: true, message: "Slot duration wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Max Booking Per Slot"
              name="max_booking_per_slot"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
            <Form.Item
              label="Max Person"
              name="max_person"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
          </div>

          <Form.Item
            label="Background"
            name="background"
            rules={[{ required: true, message: "Background wajib diisi" }]}
          >
            <Input placeholder="Putih, Merah" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
          >
            <Input.TextArea rows={2} placeholder="Paket untuk 2-4 orang" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Status"
              name="is_active"
              rules={[{ required: true, message: "Status wajib dipilih" }]}
            >
              <Radio.Group
                options={[
                  { label: "Active", value: 1 },
                  { label: "Inactive", value: 0 },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Thumbnail"
              required
              validateStatus={!uploadFiles.length ? "error" : ""}
              help={!uploadFiles.length ? "Thumbnail wajib diupload" : ""}
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Edit Paket${editingPackage ? ` - ${editingPackage.name}` : ""}`}
        open={isEditModalOpen}
        onCancel={closeEditModal}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText="Update"
        width={750}
      >
        <Form<PackageFormValues>
          layout="vertical"
          form={editForm}
          onFinish={handleUpdatePackage}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama paket wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Kategori wajib diisi" }]}
            >
              <Select
                placeholder="Pilih kategori"
                options={PACKAGE_CATEGORY_OPTIONS}
              />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Harga wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Duration (minutes)"
              name="duration_minutes"
              rules={[{ required: true, message: "Durasi wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
            <Form.Item
              label="Slot Duration"
              name="slot_duration"
              rules={[{ required: true, message: "Slot duration wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Max Booking Per Slot"
              name="max_booking_per_slot"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
            <Form.Item
              label="Max Person"
              name="max_person"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={1} />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="Background"
            name="background"
            rules={[{ required: true, message: "Background wajib diisi" }]}
          >
            <Input placeholder="Putih, Merah" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Status"
              name="is_active"
              rules={[{ required: true, message: "Status wajib dipilih" }]}
            >
              <Radio.Group
                options={[
                  { label: "Active", value: 1 },
                  { label: "Inactive", value: 0 },
                ]}
              />
            </Form.Item>

            <Form.Item label="Thumbnail (opsional, isi jika ingin ganti gambar)">
              <Upload {...editUploadProps}>
                <Button icon={<UploadOutlined />}>Ganti Gambar</Button>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Studios" className="h-full">
            {studioError ? (
              <Alert
                type="error"
                showIcon
                message="Gagal"
                description={studioError}
              />
            ) : null}

            {loadingStudios ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : null}

            {!loadingStudios && !studioError && studios.length === 0 ? (
              <Empty description="Belum ada studio" />
            ) : null}

            {!loadingStudios && !studioError && studios.length > 0 ? (
              <div className="space-y-3">
                {studios.map((studio) => {
                  const isSelected = studio.id === selectedStudioId;
                  return (
                    <button
                      key={studio.id}
                      type="button"
                      onClick={() => setSelectedStudioId(studio.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-brand-teal bg-cyan-50"
                          : "border-brand-black/10 bg-white hover:border-brand-pink/60"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-brand-black">
                          {studio.name}
                        </span>
                        <Tag color={isSelected ? "cyan" : "default"}>
                          {studio.city}
                        </Tag>
                      </div>
                      <p className="mb-1 text-xs text-brand-black/60">
                        <EnvironmentOutlined className="mr-1" />
                        {studio.address}
                      </p>
                      <p className="mb-0 text-xs text-brand-black/60">
                        <ClockCircleOutlined className="mr-1" />
                        {studio.open_time.slice(0, 5)} -{" "}
                        {studio.close_time.slice(0, 5)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            className="h-full"
            title={
              <div className="flex items-center gap-2">
                <ShopOutlined />
                <span>
                  {selectedStudio
                    ? `Packages - ${selectedStudio.name}`
                    : "Packages"}
                </span>
              </div>
            }
            extra={
              selectedStudioId ? (
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => void fetchPackages(selectedStudioId)}
                >
                  Refresh
                </Button>
              ) : null
            }
          >
            {!selectedStudioId ? (
              <Empty description="Pilih studio terlebih dahulu" />
            ) : null}

            {selectedStudioId && packagesError ? (
              <Alert
                type="error"
                showIcon
                className="!mb-3"
                message="Gagal mengambil paket"
                description={packagesError}
              />
            ) : null}

            {selectedStudioId && !packageListSupported ? (
              <Alert
                type="info"
                showIcon
                className="!mb-3"
                message="List paket belum tersedia dari API"
                description="Endpoint GET paket belum tersedia. Kamu tetap bisa menambahkan paket melalui modal Add Package."
              />
            ) : null}

            {selectedStudioId && loadingPackages ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : null}

            {selectedStudioId &&
            !loadingPackages &&
            packageListSupported &&
            packages.length === 0 ? (
              <Empty description="Belum ada paket untuk studio ini" />
            ) : null}

            {selectedStudioId &&
            !loadingPackages &&
            packageListSupported &&
            packages.length > 0 ? (
              <Row gutter={[12, 12]}>
                {packages.map((pkg) => (
                  <Col key={pkg.id} xs={24} md={12}>
                    <Card
                      size="small"
                      cover={
                        pkg.thumbnail_url ? (
                          <img
                            src={pkg.thumbnail_url}
                            alt={pkg.name}
                            className="h-36 w-full object-cover"
                          />
                        ) : null
                      }
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-semibold text-brand-black">
                          {pkg.name}
                        </span>
                        <Tag
                          color={
                            Number(pkg.is_active) === 1 ? "green" : "default"
                          }
                        >
                          {Number(pkg.is_active) === 1 ? "Active" : "Inactive"}
                        </Tag>
                      </div>

                      <p className="mb-1 text-xs text-brand-black/60">
                        {pkg.category}
                      </p>
                      <p className="mb-1 text-sm font-semibold text-brand-black">
                        {currencyIDR(pkg.price)}
                      </p>
                      <p className="mb-0 text-xs text-brand-black/60">
                        Durasi {pkg.duration_minutes} menit • Max{" "}
                        {pkg.max_person} orang
                      </p>

                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(pkg)}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Hapus paket ini?"
                          description="Data paket akan dihapus permanen."
                          okText="Hapus"
                          cancelText="Batal"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => handleDeletePackage(pkg)}
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingPackageId === pkg.id}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : null}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Packages;
