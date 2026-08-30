import { apiClient } from './client'

import type {
  Warehouse,
  WarehouseDetails,
  WarehouseLocation,
  WarehouseLocationType,
  WarehouseType,
} from '../types/warehouse'


// ============================================================
// CREATE / UPDATE PAYLOAD TYPES
// ============================================================

export type CreateWarehousePayload = {
  warehouse_code: string
  warehouse_name: string
  warehouse_type: WarehouseType

  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  country: string

  is_active: boolean

  created_by: number
  updated_by: number
}


export type UpdateWarehousePayload = {
  warehouse_name?: string
  warehouse_type?: WarehouseType

  address?: string | null
  city?: string | null
  state?: string | null
  postcode?: string | null
  country?: string

  is_active?: boolean

  updated_by: number
}


export type CreateWarehouseLocationPayload = {
  location_code: string
  location_name: string
  location_type: WarehouseLocationType

  aisle: string | null
  rack: string | null
  bin: string | null

  is_receiving_location: boolean
  is_quarantine_location: boolean
  is_active: boolean

  created_by: number
  updated_by: number
}


export type UpdateWarehouseLocationPayload = {
  location_name?: string
  location_type?: WarehouseLocationType

  aisle?: string | null
  rack?: string | null
  bin?: string | null

  is_receiving_location?: boolean
  is_quarantine_location?: boolean
  is_active?: boolean

  updated_by: number
}


// ============================================================
// ERROR HANDLING
// ============================================================

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const errorData = await response
    .json()
    .catch(() => null)

  if (
    errorData &&
    typeof errorData.detail === 'string'
  ) {
    return errorData.detail
  }

  return fallbackMessage
}


// ============================================================
// GET ALL WAREHOUSES
// ============================================================

export const getWarehouses =
  async (): Promise<Warehouse[]> => {
    const response = await apiClient(
      '/api/v1/warehouses',
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to load warehouses.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// GET ONE WAREHOUSE
// ============================================================

export const getWarehouse =
  async (
    warehouseId: number,
  ): Promise<WarehouseDetails> => {
    const response = await apiClient(
      `/api/v1/warehouses/${warehouseId}`,
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to load warehouse.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// CREATE WAREHOUSE
// ============================================================

export const createWarehouse =
  async (
    payload: CreateWarehousePayload,
  ): Promise<Warehouse> => {
    const response = await apiClient(
      '/api/v1/warehouses',
      {
        method: 'POST',

        body: JSON.stringify(
          payload,
        ),
      },
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to create warehouse.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// UPDATE WAREHOUSE
// ============================================================

export const updateWarehouse =
  async (
    warehouseId: number,
    payload: UpdateWarehousePayload,
  ): Promise<Warehouse> => {
    const response = await apiClient(
      `/api/v1/warehouses/${warehouseId}`,
      {
        method: 'PATCH',

        body: JSON.stringify(
          payload,
        ),
      },
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to update warehouse.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// GET WAREHOUSE LOCATIONS
// ============================================================

export const getWarehouseLocations =
  async (
    warehouseId: number,
    activeOnly = false,
  ): Promise<WarehouseLocation[]> => {
    const query = activeOnly
      ? '?active_only=true'
      : ''

    const response = await apiClient(
      `/api/v1/warehouses/${warehouseId}/locations${query}`,
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to load warehouse locations.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// GET ACTIVE RECEIVING LOCATIONS
// ============================================================

export const getReceivingLocations =
  async (
    warehouseId: number,
  ): Promise<WarehouseLocation[]> => {
    const locations =
      await getWarehouseLocations(
        warehouseId,
        true,
      )

    return locations.filter(
      (location) =>
        location.is_active &&
        location.is_receiving_location &&
        location.location_type ===
          'RECEIVING',
    )
  }


// ============================================================
// GET ACTIVE QUARANTINE LOCATIONS
// ============================================================

export const getQuarantineLocations =
  async (
    warehouseId: number,
  ): Promise<WarehouseLocation[]> => {
    const locations =
      await getWarehouseLocations(
        warehouseId,
        true,
      )

    return locations.filter(
      (location) =>
        location.is_active &&
        location.is_quarantine_location &&
        location.location_type ===
          'QUARANTINE',
    )
  }


// ============================================================
// CREATE LOCATION
// ============================================================

export const createWarehouseLocation =
  async (
    warehouseId: number,
    payload:
      CreateWarehouseLocationPayload,
  ): Promise<WarehouseLocation> => {
    const response = await apiClient(
      `/api/v1/warehouses/${warehouseId}/locations`,
      {
        method: 'POST',

        body: JSON.stringify(
          payload,
        ),
      },
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to create warehouse location.',
        ),
      )
    }

    return response.json()
  }


// ============================================================
// UPDATE LOCATION
// ============================================================

export const updateWarehouseLocation =
  async (
    locationId: number,
    payload:
      UpdateWarehouseLocationPayload,
  ): Promise<WarehouseLocation> => {
    const response = await apiClient(
      `/api/v1/warehouses/locations/${locationId}`,
      {
        method: 'PATCH',

        body: JSON.stringify(
          payload,
        ),
      },
    )

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Unable to update warehouse location.',
        ),
      )
    }

    return response.json()
  }