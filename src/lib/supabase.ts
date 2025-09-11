import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'turnkey-ams-web'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Add configuration check function
export const checkSupabaseConfig = () => {
  const config = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey ? 'Present' : 'Missing',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  };
  
  console.log('Supabase Configuration:', config);
  
  if (!config.hasUrl || !config.hasKey) {
    console.error('❌ Supabase configuration incomplete');
    return false;
  }
  
  console.log('✅ Supabase configuration complete');
  return true;
}

// Add connection health check
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Database connection check failed:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

// Add reconnection logic
export const reconnectSupabase = async () => {
  try {
    console.log('Attempting to reconnect to Supabase...')
    const isConnected = await checkConnection()
    
    if (isConnected) {
      console.log('Successfully reconnected to Supabase')
      return true
    } else {
      console.log('Failed to reconnect to Supabase')
      return false
    }
  } catch (error) {
    console.error('Reconnection error:', error)
    return false
  }
}

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
  comment_count: number
  created_at: string
  updated_at: string
}

export interface IssueComment {
  id: string
  issue_id: string
  user_id: string
  user_name: string
  content: string
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

export interface NotificationRecord {
  id: string
  user_id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  created_at: string
}

export interface AssetRequest {
  id: string
  user_id: string
  asset_name: string
  asset_type: string
  category: string
  reason: string
  priority: string
  status: string
  requested_date: string
  approved_date: string | null
  approved_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
