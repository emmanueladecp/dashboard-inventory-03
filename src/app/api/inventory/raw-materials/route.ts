import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role and area
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, area_id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let query = supabaseAdmin
      .from('raw_materials')
      .select(`
        *,
        master_areas!inner(id, name, erp_id)
      `);

    // Apply area filtering based on user role
    if (userProfile.role !== 'superadmin' && userProfile.area_id) {
      query = query.eq('area_id', userProfile.area_id);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching raw materials:', error);
      return NextResponse.json({ error: 'Failed to fetch raw materials' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Raw materials API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}