export type WarehouseType =
  | 'RAW_MATERIAL'
  | 'FINISHED_GOODS'
  | 'QUARANTINE'
  | 'GENERAL'

export type WarehouseLocationType =
  | 'STORAGE'
  | 'RECEIVING'
  | 'QUARANTINE'
  | 'DISPATCH'


export type Warehouse = {
  warehouse_id: number

  warehouse_code: string
  warehouse_name: string
  warehouse_type: WarehouseType

  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  country: string

  is_active: boolean

  created_at: string
  created_by: number

  updated_at: string
  updated_by: number
}


export type WarehouseLocation = {
  warehouse_location_id: number

  warehouse_id: number

  location_code: string
  location_name: string
  location_type: WarehouseLocationType

  aisle: string | null
  rack: string | null
  bin: string | null

  is_receiving_location: boolean
  is_quarantine_location: boolean
  is_active: boolean

  created_at: string
  created_by: number

  updated_at: string
  updated_by: number
}


export type WarehouseDetails =
  Warehouse & {
    locations: WarehouseLocation[]
  }