import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Row,
  Skeleton,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  createStudio,
  deleteStudio,
  getStudios,
  type Studio,
  updateStudio,
} from "../services/studio.service";
import { clearAuthSession } from "../utils/auth";

const { Title, Paragraph, Text } = Typography;

interface CreateStudioFormValues {
  name: string;
  address: string;
  city: string;
  open_time: string;
  close_time: string;
}

// Studio listing page for /admin/studios.
const Studios = (): JSX.Element => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateStudioFormValues>();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const [editForm] = Form.useForm<CreateStudioFormValues>();
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [editUploadFiles, setEditUploadFiles] = useState<UploadFile[]>([]);

  const [deletingStudioId, setDeletingStudioId] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  const fetchStudios = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const result = await getStudios();
      setStudios(result);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengambil data studio.";
        setError(apiMessage);
      } else {
        setError("Terjadi kesalahan saat mengambil data studio.");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = (): void => {
    setIsAddModalOpen(false);
    form.resetFields();
    setUploadFiles([]);
  };

  const handleCreateStudio = async (
    values: CreateStudioFormValues,
  ): Promise<void> => {
    const selectedFile = uploadFiles[0]?.originFileObj;
    if (!selectedFile) {
      notification.error({
        message: "Thumbnail wajib diisi",
        description: "Silakan upload thumbnail studio.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createStudio({
        ...values,
        thumbnail: selectedFile as File,
      });
      notification.success({
        message: "Studio berhasil ditambahkan",
      });
      closeAddModal();
      await fetchStudios();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal menambahkan studio.";
        notification.error({
          message: "Add studio gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Add studio gagal",
          description: "Terjadi kesalahan saat menambahkan studio.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: "image/*",
    beforeUpload: () => false,
    maxCount: 1,
    fileList: uploadFiles,
    onChange: ({ fileList }) => {
      setUploadFiles(fileList.slice(-1));
    },
  };

  const openEditModal = (studio: Studio): void => {
    setEditingStudio(studio);
    editForm.setFieldsValue({
      name: studio.name,
      address: studio.address,
      city: studio.city,
      open_time: studio.open_time.slice(0, 5),
      close_time: studio.close_time.slice(0, 5),
    });
    setEditUploadFiles([]);
    setIsEditModalOpen(true);
  };

  const closeEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingStudio(null);
    setEditUploadFiles([]);
    editForm.resetFields();
  };

  const handleUpdateStudio = async (
    values: CreateStudioFormValues,
  ): Promise<void> => {
    if (!editingStudio) return;

    try {
      setIsUpdating(true);
      await updateStudio(editingStudio.id, {
        ...values,
        thumbnail: editUploadFiles[0]?.originFileObj as File | undefined,
      });
      notification.success({
        message: "Studio berhasil diupdate",
      });
      closeEditModal();
      await fetchStudios();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal mengupdate studio.";
        notification.error({
          message: "Edit studio gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Edit studio gagal",
          description: "Terjadi kesalahan saat mengupdate studio.",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const editUploadProps: UploadProps = {
    accept: "image/*",
    beforeUpload: () => false,
    maxCount: 1,
    fileList: editUploadFiles,
    onChange: ({ fileList }) => {
      setEditUploadFiles(fileList.slice(-1));
    },
  };

  const handleDeleteStudio = async (studio: Studio): Promise<void> => {
    try {
      setDeletingStudioId(studio.id);
      await deleteStudio(studio.id);
      notification.success({
        message: "Studio berhasil dihapus",
      });
      await fetchStudios();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Gagal menghapus studio.";
        notification.error({
          message: "Delete studio gagal",
          description: apiMessage,
        });
      } else {
        notification.error({
          message: "Delete studio gagal",
          description: "Terjadi kesalahan saat menghapus studio.",
        });
      }
    } finally {
      setDeletingStudioId(null);
    }
  };

  useEffect(() => {
    void fetchStudios();
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-slate-800">
            Studios
          </Title>
        </div>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Studio
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchStudios()}>
            Refresh
          </Button>
        </div>
      </div>

      <Modal
        title="Tambah Studio Baru"
        open={isAddModalOpen}
        onCancel={closeAddModal}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
        okText="Simpan"
        centered
      >
        <Form<CreateStudioFormValues>
          layout="vertical"
          form={form}
          onFinish={handleCreateStudio}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama studio wajib diisi" }]}
          >
            <Input placeholder="Studio A" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Alamat wajib diisi" }]}
          >
            <Input.TextArea rows={3} placeholder="Jl. Sudirman No. 10" />
          </Form.Item>

          <Form.Item
            label="City"
            name="city"
            rules={[{ required: true, message: "Kota wajib diisi" }]}
          >
            <Input placeholder="Jakarta" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Open Time"
              name="open_time"
              rules={[{ required: true, message: "Jam buka wajib diisi" }]}
            >
              <Input type="time" />
            </Form.Item>
            <Form.Item
              label="Close Time"
              name="close_time"
              rules={[{ required: true, message: "Jam tutup wajib diisi" }]}
            >
              <Input type="time" />
            </Form.Item>
          </div>

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
        </Form>
      </Modal>

      <Modal
        title={`Edit Studio${editingStudio ? ` - ${editingStudio.name}` : ""}`}
        open={isEditModalOpen}
        onCancel={closeEditModal}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText="Update"
        centered
      >
        <Form<CreateStudioFormValues>
          layout="vertical"
          form={editForm}
          onFinish={handleUpdateStudio}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama studio wajib diisi" }]}
          >
            <Input placeholder="Studio A" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Alamat wajib diisi" }]}
          >
            <Input.TextArea rows={3} placeholder="Jl. Sudirman No. 10" />
          </Form.Item>

          <Form.Item
            label="City"
            name="city"
            rules={[{ required: true, message: "Kota wajib diisi" }]}
          >
            <Input placeholder="Jakarta" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              label="Open Time"
              name="open_time"
              rules={[{ required: true, message: "Jam buka wajib diisi" }]}
            >
              <Input type="time" />
            </Form.Item>
            <Form.Item
              label="Close Time"
              name="close_time"
              rules={[{ required: true, message: "Jam tutup wajib diisi" }]}
            >
              <Input type="time" />
            </Form.Item>
          </div>

          <Form.Item label="Thumbnail (opsional, isi jika ingin ganti gambar)">
            <Upload {...editUploadProps}>
              <Button icon={<UploadOutlined />}>Ganti Gambar</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {error ? (
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="Studios error"
          description={error}
        />
      ) : null}

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((value) => (
            <Col key={value} xs={24} md={12} xl={8}>
              <Card>
                <Skeleton.Image active className="!h-[180px] !w-full" />
                <Skeleton active paragraph={{ rows: 3 }} className="mt-4" />
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {!loading && !error && studios.length === 0 ? (
        <Empty description="Belum ada studio" />
      ) : null}

      {!loading && !error && studios.length > 0 ? (
        <Row gutter={[16, 16]}>
          {studios.map((studio) => {
            const imageUrl = studio.thumbnail_url;
            const imageBroken = brokenImages[studio.id];

            return (
              <Col key={studio.id} xs={24} md={12} xl={8}>
                <Card
                  className="overflow-hidden border-slate-200 shadow-sm transition hover:shadow-md"
                  bodyStyle={{ padding: 16 }}
                  cover={
                    imageUrl && !imageBroken ? (
                      <img
                        src={imageUrl}
                        alt={studio.name}
                        className="h-48 w-full object-cover"
                        onError={() =>
                          setBrokenImages((prev) => ({
                            ...prev,
                            [studio.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-pink-100">
                        <span className="text-lg font-semibold text-slate-600">
                          {studio.name}
                        </span>
                      </div>
                    )
                  }
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Title level={4} className="!mb-0 !text-slate-800">
                      {studio.name}
                    </Title>
                    <Tag color="cyan">{studio.city}</Tag>
                  </div>

                  <Paragraph className="!mb-3 !text-slate-600">
                    <EnvironmentOutlined className="mr-2" />
                    {studio.address}
                  </Paragraph>

                  <div className="flex items-center gap-2 text-slate-600">
                    <FieldTimeOutlined />
                    <Text className="!text-slate-600">
                      {studio.open_time.slice(0, 5)} -{" "}
                      {studio.close_time.slice(0, 5)}
                    </Text>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(studio)}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Hapus studio ini?"
                      description="Data studio akan dihapus permanen."
                      okText="Hapus"
                      cancelText="Batal"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteStudio(studio)}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingStudioId === studio.id}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : null}
    </div>
  );
};

export default Studios;
