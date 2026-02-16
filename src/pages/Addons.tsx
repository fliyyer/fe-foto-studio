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
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  createPackageAddon,
  deletePackageAddon,
  getPackageAddons,
  type Addon,
  updatePackageAddon,
} from "../services/addon.service";
import {
  getStudioPackages,
  type StudioPackage,
} from "../services/package.service";
import { getStudios, type Studio } from "../services/studio.service";
import { clearAuthSession } from "../utils/auth";

const { Title, Paragraph } = Typography;

interface AddonFormValues {
  name: string;
  price: number;
  type: string;
  description: string;
  is_active: 1 | 0;
}

const currencyIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// Add-ons page: pick studio -> pick package -> manage add-ons.
const Addons = (): JSX.Element => {
  const navigate = useNavigate();
  const [form] = Form.useForm<AddonFormValues>();
  const [editForm] = Form.useForm<AddonFormValues>();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [loadingStudios, setLoadingStudios] = useState<boolean>(true);
  const [studioError, setStudioError] = useState<string>("");

  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    null,
  );
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [packagesError, setPackagesError] = useState<string>("");

  const [addons, setAddons] = useState<Addon[]>([]);
  const [loadingAddons, setLoadingAddons] = useState<boolean>(false);
  const [addonsError, setAddonsError] = useState<string>("");

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);

  const [deletingAddonId, setDeletingAddonId] = useState<number | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
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

        setStudioError(
          (err.response?.data as { message?: string } | undefined)?.message ??
            "Gagal mengambil daftar studio.",
        );
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
      setSelectedPackageId((prev) => {
        if (prev && result.some((pkg) => pkg.id === prev)) return prev;
        return result[0]?.id ?? null;
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setPackagesError(
          (err.response?.data as { message?: string } | undefined)?.message ??
            "Gagal mengambil daftar package.",
        );
      } else {
        setPackagesError("Terjadi kesalahan saat mengambil daftar package.");
      }
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchAddons = async (
    studioId: number,
    packageId: number,
  ): Promise<void> => {
    try {
      setLoadingAddons(true);
      setAddonsError("");
      const result = await getPackageAddons(studioId, packageId);
      setAddons(result);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setAddonsError(
          (err.response?.data as { message?: string } | undefined)?.message ??
            "Gagal mengambil daftar add-ons.",
        );
      } else {
        setAddonsError("Terjadi kesalahan saat mengambil daftar add-ons.");
      }
    } finally {
      setLoadingAddons(false);
    }
  };

  const closeAddModal = (): void => {
    setIsAddModalOpen(false);
    form.resetFields();
  };

  const closeEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingAddon(null);
    editForm.resetFields();
  };

  const handleCreateAddon = async (values: AddonFormValues): Promise<void> => {
    if (!selectedStudioId || !selectedPackageId) {
      notification.error({
        message: "Pilih studio dan package dulu",
      });
      return;
    }

    try {
      setIsCreating(true);
      await createPackageAddon(selectedStudioId, selectedPackageId, {
        ...values,
        is_active: values.is_active === 1,
      });
      notification.success({
        message: "Add-on berhasil ditambahkan",
      });
      closeAddModal();
      await fetchAddons(selectedStudioId, selectedPackageId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        notification.error({
          message: "Add-on gagal ditambahkan",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat menambahkan add-on.",
        });
      } else {
        notification.error({
          message: "Add-on gagal ditambahkan",
          description: "Terjadi kesalahan saat menambahkan add-on.",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (addon: Addon): void => {
    setEditingAddon(addon);
    editForm.setFieldsValue({
      name: addon.name,
      price: addon.price,
      type: addon.type,
      description: addon.description ?? "",
      is_active: Number(addon.is_active) === 1 ? 1 : 0,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAddon = async (values: AddonFormValues): Promise<void> => {
    if (!selectedStudioId || !selectedPackageId || !editingAddon) return;

    try {
      setIsUpdating(true);
      await updatePackageAddon(
        selectedStudioId,
        selectedPackageId,
        editingAddon.id,
        {
          ...values,
          is_active: values.is_active === 1,
        },
      );
      notification.success({
        message: "Add-on berhasil diupdate",
      });
      closeEditModal();
      await fetchAddons(selectedStudioId, selectedPackageId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        notification.error({
          message: "Edit add-on gagal",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat update add-on.",
        });
      } else {
        notification.error({
          message: "Edit add-on gagal",
          description: "Terjadi kesalahan saat update add-on.",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAddon = async (addon: Addon): Promise<void> => {
    if (!selectedStudioId || !selectedPackageId) return;

    try {
      setDeletingAddonId(addon.id);
      await deletePackageAddon(selectedStudioId, selectedPackageId, addon.id);
      notification.success({
        message: "Add-on berhasil dihapus",
      });
      await fetchAddons(selectedStudioId, selectedPackageId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        notification.error({
          message: "Delete add-on gagal",
          description:
            (err.response?.data as { message?: string } | undefined)?.message ??
            "Terjadi kesalahan saat menghapus add-on.",
        });
      } else {
        notification.error({
          message: "Delete add-on gagal",
          description: "Terjadi kesalahan saat menghapus add-on.",
        });
      }
    } finally {
      setDeletingAddonId(null);
    }
  };

  useEffect(() => {
    void fetchStudios();
  }, []);

  useEffect(() => {
    if (!selectedStudioId) return;
    void fetchPackages(selectedStudioId);
  }, [selectedStudioId]);

  useEffect(() => {
    if (!selectedStudioId || !selectedPackageId) return;
    void fetchAddons(selectedStudioId, selectedPackageId);
  }, [selectedStudioId, selectedPackageId]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-slate-800">
            Add-ons
          </Title>
          <Paragraph className="!mb-0 !text-slate-500">
            Pilih studio dan package terlebih dahulu, lalu kelola add-ons per
            package.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchStudios()}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={!selectedStudioId || !selectedPackageId}
          >
            Add Add-on
          </Button>
        </Space>
      </div>

      <Modal
        title={`Tambah Add-on${selectedPackage ? ` - ${selectedPackage.name}` : ""}`}
        open={isAddModalOpen}
        onCancel={closeAddModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        centered
        okText="Simpan"
      >
        <Form<AddonFormValues>
          layout="vertical"
          form={form}
          onFinish={handleCreateAddon}
          initialValues={{ is_active: 1 }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input placeholder="Jas Hitam" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Harga wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Type wajib diisi" }]}
            >
              <Input placeholder="costume" />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
          >
            <Input.TextArea rows={3} placeholder="Jas hitam berukuran M/L/XL" />
          </Form.Item>

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
        </Form>
      </Modal>

      <Modal
        title={`Edit Add-on${editingAddon ? ` - ${editingAddon.name}` : ""}`}
        open={isEditModalOpen}
        onCancel={closeEditModal}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText="Update"
      >
        <Form<AddonFormValues>
          layout="vertical"
          form={editForm}
          onFinish={handleUpdateAddon}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Harga wajib diisi" }]}
            >
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Type wajib diisi" }]}
            >
              <Input />
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
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
          <Card title="Studios">
            {studioError ? (
              <Alert type="error" showIcon message={studioError} />
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
                  const selected = studio.id === selectedStudioId;
                  return (
                    <button
                      key={studio.id}
                      type="button"
                      onClick={() => setSelectedStudioId(studio.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-brand-teal bg-cyan-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {studio.name}
                        </span>
                        <Tag color={selected ? "cyan" : "default"}>
                          {studio.city}
                        </Tag>
                      </div>
                      <p className="mb-1 text-xs text-slate-500">
                        <EnvironmentOutlined className="mr-1" />
                        {studio.address}
                      </p>
                      <p className="mb-0 text-xs text-slate-500">
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

        <Col xs={24} lg={8}>
          <Card title="Packages">
            {!selectedStudioId ? (
              <Empty description="Pilih studio dulu" />
            ) : null}
            {selectedStudioId && packagesError ? (
              <Alert type="error" showIcon message={packagesError} />
            ) : null}
            {selectedStudioId && loadingPackages ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : null}
            {selectedStudioId &&
            !loadingPackages &&
            !packagesError &&
            packages.length === 0 ? (
              <Empty description="Belum ada package" />
            ) : null}

            {selectedStudioId &&
            !loadingPackages &&
            !packagesError &&
            packages.length > 0 ? (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const selected = pkg.id === selectedPackageId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-brand-teal bg-cyan-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
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
                      <p className="mb-0 text-xs text-slate-500">
                        {pkg.category}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={
              selectedPackage ? `Add-ons - ${selectedPackage.name}` : "Add-ons"
            }
            extra={
              selectedStudioId && selectedPackageId ? (
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    void fetchAddons(selectedStudioId, selectedPackageId)
                  }
                >
                  Refresh
                </Button>
              ) : null
            }
          >
            {!selectedStudioId || !selectedPackageId ? (
              <Empty description="Pilih studio & package dulu" />
            ) : null}
            {selectedStudioId && selectedPackageId && addonsError ? (
              <Alert
                type="error"
                showIcon
                message={addonsError}
                className="!mb-3"
              />
            ) : null}
            {selectedStudioId && selectedPackageId && loadingAddons ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : null}
            {selectedStudioId &&
            selectedPackageId &&
            !loadingAddons &&
            !addonsError &&
            addons.length === 0 ? (
              <Empty description="Belum ada add-ons" />
            ) : null}

            {selectedStudioId &&
            selectedPackageId &&
            !loadingAddons &&
            !addonsError &&
            addons.length > 0 ? (
              <div className="space-y-3">
                {addons.map((addon) => (
                  <Card key={addon.id} size="small">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        {addon.name}
                      </span>
                      <Tag
                        color={
                          Number(addon.is_active) === 1 ? "green" : "default"
                        }
                      >
                        {Number(addon.is_active) === 1 ? "Active" : "Inactive"}
                      </Tag>
                    </div>
                    <p className="mb-1 text-xs text-slate-500">{addon.type}</p>
                    <p className="mb-1 text-sm font-semibold text-slate-800">
                      {currencyIDR(addon.price)}
                    </p>
                    <p className="mb-0 text-xs text-slate-500">
                      {addon.description ?? "-"}
                    </p>

                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(addon)}
                      >
                        Edit
                      </Button>
                      <Popconfirm
                        title="Hapus add-on ini?"
                        description="Data add-on akan dihapus permanen."
                        okText="Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteAddon(addon)}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletingAddonId === addon.id}
                        >
                          Delete
                        </Button>
                      </Popconfirm>
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Addons;
