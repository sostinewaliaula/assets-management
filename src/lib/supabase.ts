import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Department {
  id: string
  name: string
  description: string
  location: string
  user_count: number
  asset_count: number
  asset_value: string
  manager: string
  manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  name: string
  type: string
  category: string
  manufacturer: string
  model: string
  serial_number: string
  purchase_date: string
  purchase_price: number
  current_value: number
  status: string
  condition: string
  location: string
  assigned_to: string | null
  department_id: string | null
  warranty_expiry: string | null
  last_maintenance: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  department_id: string | null
  phone: string | null
  position: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string | null
  reported_by: string
  assigned_to: string | null
  asset_id: string | null
  department_id: string | null
  estimated_resolution_date: string | null
  actual_resolution_date: string | null
  created_at: string
  updated_at: string
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: string
  description: string | null
  performed_by: string | null
  performed_date: string
  cost: number | null
  next_maintenance_date: string | null
  created_at: string
}
