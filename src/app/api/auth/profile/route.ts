import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile with area information
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        clerk_user_id,
        email,
        full_name,
        role,
        area_id,
        created_at,
        updated_at,
        master_areas(id, name, erp_id)
      `)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Profile API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName } = body;

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        full_name: fullName
      })
      .eq('clerk_user_id', userId)
      .select(`
        id,
        clerk_user_id,
        email,
        full_name,
        role,
        area_id,
        created_at,
        updated_at,
        master_areas(id, name, erp_id)
      `)
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Profile PUT API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}