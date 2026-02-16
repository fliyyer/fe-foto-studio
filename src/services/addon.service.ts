import { http } from "./http";
import type { ApiResponse } from "../types/api";

interface AddonResponse {
  id: number;
  studio_id?: number;
  package_id: number;
  name: string;
  price: number;
  type: string;
  description: string | null;
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Addon extends AddonResponse {}

interface AddonPayloadBase {
  name: string;
  price: number;
  type: string;
  description: string;
  is_active: boolean;
}

export interface CreateAddonPayload extends AddonPayloadBase {}
export interface UpdateAddonPayload extends AddonPayloadBase {}

const mapAddon = (addon: AddonResponse): Addon => ({
  ...addon,
});

// GET /studios/:studioId/packages/:packageId/addons
export const getPackageAddons = async (
  studioId: number,
  packageId: number,
): Promise<Addon[]> => {
  const { data } = await http.get<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}/addons`,
  );

  const rootData = data.data as unknown;
  const list = Array.isArray(rootData)
    ? rootData
    : Array.isArray((rootData as { data?: unknown[] } | undefined)?.data)
      ? (rootData as { data: unknown[] }).data
      : [];

  return list.map((item) => mapAddon(item as AddonResponse));
};

// POST /studios/:studioId/packages/:packageId/addons
export const createPackageAddon = async (
  studioId: number,
  packageId: number,
  payload: CreateAddonPayload,
): Promise<void> => {
  await http.post<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}/addons`,
    payload,
  );
};

// POST /studios/:studioId/packages/:packageId/addons/:addonId
export const updatePackageAddon = async (
  studioId: number,
  packageId: number,
  addonId: number,
  payload: UpdateAddonPayload,
): Promise<void> => {
  await http.post<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}/addons/${addonId}`,
    payload,
  );
};

// DELETE /studios/:studioId/packages/:packageId/addons/:addonId
export const deletePackageAddon = async (
  studioId: number,
  packageId: number,
  addonId: number,
): Promise<void> => {
  await http.delete<ApiResponse<unknown>>(
    `/studios/${studioId}/packages/${packageId}/addons/${addonId}`,
  );
};
