import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Helper function to check if user is superadmin
async function checkSuperadminAccess(userId: string) {
  const { data: userProfile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();

  if (error || userProfile?.role !== 'superadmin') {
    return false;
  }
  return true;
}

// GET - Fetch user-area mappings for a specific user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check superadmin access
    const isSuperadmin = await checkSuperadminAccess(userId);
    if (!isSuperadmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userProfileId = searchParams.get('userProfileId');

    if (!userProfileId) {
      return NextResponse.json({ error: 'User profile ID is required' }, { status: 400 });
    }

    // Fetch user-area mappings
    const { data, error } = await supabaseAdmin
      .from('user_area_mappings')
      .select(`
        id,
        user_profile_id,
        area_id,
        created_at,
        master_areas(id, name, erp_id, is_active)
      `)
      .eq('user_profile_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user-area mappings:', error);
      return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('User-area mappings GET API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

// POST - Create new user-area mapping
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check superadmin access
    const isSuperadmin = await checkSuperadminAccess(userId);
    if (!isSuperadmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userProfileId, areaId } = body;

    if (!userProfileId || !areaId) {
      return NextResponse.json({ error: 'User profile ID and area ID are required' }, { status: 400 });
    }

    // Create user-area mapping
    const { data, error } = await supabaseAdmin
      .from('user_area_mappings')
      .insert({
        user_profile_id: userProfileId,
        area_id: areaId
      })
      .select(`
        id,
        user_profile_id,
        area_id,
        created_at,
        master_areas(id, name, erp_id, is_active)
      `)
      .single();

    if (error) {
      console.error('Error creating user-area mapping:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'User is already mapped to this area' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'User-area mapping created successfully' }, { status: 201 });
  } catch (error) {
    console.error('User-area mappings POST API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

// DELETE - Remove user-area mapping
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check superadmin access
    const isSuperadmin = await checkSuperadminAccess(userId);
    if (!isSuperadmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userProfileId, areaId } = body;

    if (!userProfileId || !areaId) {
      return NextResponse.json({ error: 'User profile ID and area ID are required' }, { status: 400 });
    }

    // Delete user-area mapping
    const { error } = await supabaseAdmin
      .from('user_area_mappings')
      .delete()
      .eq('user_profile_id', userProfileId)
      .eq('area_id', areaId);

    if (error) {
      console.error('Error deleting user-area mapping:', error);
      return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User-area mapping deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('User-area mappings DELETE API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}