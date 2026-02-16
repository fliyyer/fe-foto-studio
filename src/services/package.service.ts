import { http, resolveApiAssetUrl } from "./http";
import type { ApiResponse } from "../types/api";

interface StudioPackageResponse {
  id: number;
  studio_id: number;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  slot_duration: number;
  max_booking_per_slot: number;
  description: string | null;
  max_person: number;
  is_active: boolean | number;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioPackage extends StudioPackageResponse {
  thumbnail_url: string;
}

interface StudioPackagePayloadBase {
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  slot_duration: number;
  max_booking_per_slot: number;
  description: string;
  max_person: number;
  is_active: boolean;
}

export interface CreateStudioPackagePayload extends StudioPackagePayloadBase {
  thumbnail: File;
}

export interface UpdateStudioPackagePayload extends StudioPackagePayloadBase {
  thumbnail?: File;
}

const mapPackage = (pkg: StudioPackageResponse): StudioPackage => ({
  ...pkg,
  thumbnail_url: resolveApiAssetUrl(pkg.thumbnail),
});

// GET /studios/:id/packages package list for selected studio.
export const getStudioPackages = async (
  studioId: number,
): Promise<StudioPackage[]> => {
  const { data } = await http.get<ApiResponse<unknown>>(`/studios/${studioId}/packages`);

  const rootData = data.data as unknown;
  const list = Array.isArray(rootData)
    ? rootData
    : Array.isArray((rootData as { data?: unknown[] } | undefined)?.data)
      ? ((rootData as { data: unknown[] }).data)
      : [];

  return list.map((item) => mapPackage(item as StudioPackageResponse));
};

// POST /studios/:id/packages create a package under studio.
export const createStudioPackage = async (
  studioId: number,
  payload: CreateStudioPackagePayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("category", payload.category);
  formData.append("price", String(payload.price));
  formData.append("duration_minutes", String(payload.duration_minutes));
  formData.append("slot_duration", String(payload.slot_duration));
  formData.append("max_booking_per_slot", String(payload.max_booking_per_slot));
  formData.append("description", payload.description);
  formData.append("max_person", String(payload.max_person));
  formData.append("is_active", payload.is_active ? "1" : "0");
  formData.append("thumbnail", payload.thumbnail);

  await http.post<ApiResponse<unknown>>(`/studios/${studioId}/packages`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// POST /studios/:studioId/packages/:packageId update a package.
export const updateStudioPackage = async (
  studioId: number,
  packageId: number,
  payload: UpdateStudioPackagePayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("category", payload.category);
  formData.append("price", String(payload.price));
  formData.append("duration_minutes", String(payload.duration_minutes));
  formData.append("slot_duration", String(payload.slot_duration));
  formData.append("max_booking_per_slot", String(payload.max_booking_per_slot));
  formData.append("description", payload.description);
  formData.append("max_person", String(payload.max_person));
  formData.append("is_active", payload.is_active ? "1" : "0");
  if (payload.thumbnail) {
    formData.append("thumbnail", payload.thumbnail);
  }

  await http.post<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

// DELETE /studios/:studioId/packages/:packageId delete a package.
export const deleteStudioPackage = async (
  studioId: number,
  packageId: number,
): Promise<void> => {
  await http.delete<ApiResponse<unknown>>(`/studios/${studioId}/packages/${packageId}`);
};
