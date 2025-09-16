import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need to bypass RLS
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name?: string;
  role: 'superadmin' | 'area sales manager' | 'area sales supervisor';
  area_id?: number;
  created_at: string;
  updated_at: string;
}

export interface MasterArea {
  id: number;
  name: string;
  erp_id: number;
  created_at: string;
  updated_at: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  erp_id: number;
  current_stock: number;
  unit: string;
  area_id: number;
  created_at: string;
  updated_at: string;
}

export interface FinishedGoods {
  id: number;
  name: string;
  erp_id: number;
  current_stock: number;
  unit: string;
  area_id: number;
  created_at: string;
  updated_at: string;
}