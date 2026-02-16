import { http, resolveApiAssetUrl } from "./http";
import type { ApiResponse } from "../types/api";

interface StudioPayloadBase {
  name: string;
  address: string;
  city: string;
  open_time: string;
  close_time: string;
}

interface StudioResponse extends StudioPayloadBase {
  id: number;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface Studio extends StudioResponse {
  thumbnail_url: string;
}

export interface CreateStudioPayload extends StudioPayloadBase {
  thumbnail: File;
}

export interface UpdateStudioPayload extends StudioPayloadBase {
  thumbnail?: File;
}

// GET /studios list for admin studio page.
export const getStudios = async (): Promise<Studio[]> => {
  const { data } = await http.get<ApiResponse<StudioResponse[]>>("/studios");
  return data.data.map((studio) => ({
    ...studio,
    thumbnail_url: resolveApiAssetUrl(studio.thumbnail),
  }));
};

// POST /studios create a new studio.
export const createStudio = async (
  payload: CreateStudioPayload,
): Promise<Studio> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("address", payload.address);
  formData.append("city", payload.city);
  formData.append("open_time", payload.open_time);
  formData.append("close_time", payload.close_time);
  formData.append("thumbnail", payload.thumbnail);

  const { data } = await http.post<ApiResponse<StudioResponse>>(
    "/studios",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return {
    ...data.data,
    thumbnail_url: resolveApiAssetUrl(data.data.thumbnail),
  };
};

// PUT /studios/:id update an existing studio.
export const updateStudio = async (
  studioId: number,
  payload: UpdateStudioPayload,
): Promise<Studio> => {
  const formData = new FormData();
  // Laravel-friendly method override for multipart update.
  // multipart/form-data with real PUT often fails to parse in PHP runtime.
  formData.append("_method", "PUT");
  formData.append("name", payload.name);
  formData.append("address", payload.address);
  formData.append("city", payload.city);
  formData.append("open_time", payload.open_time);
  formData.append("close_time", payload.close_time);
  if (payload.thumbnail) {
    formData.append("thumbnail", payload.thumbnail);
  }

  const { data } = await http.post<ApiResponse<StudioResponse>>(
    `/studios/${studioId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return {
    ...data.data,
    thumbnail_url: resolveApiAssetUrl(data.data.thumbnail),
  };
};

// DELETE /studios/:id remove studio.
export const deleteStudio = async (studioId: number): Promise<void> => {
  await http.delete<ApiResponse<null>>(`/studios/${studioId}`);
};
