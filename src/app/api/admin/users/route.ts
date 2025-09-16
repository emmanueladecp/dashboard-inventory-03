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

export async function GET() {
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

    // Fetch all users with their area information (including inactive ones for superadmin)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        clerk_user_id,
        email,
        full_name,
        role,
        area_id,
        is_active,
        created_at,
        updated_at,
        master_areas(id, name, erp_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Admin users API error:', error);
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

    // Check superadmin access
    const isSuperadmin = await checkSuperadminAccess(userId);
    if (!isSuperadmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userProfileId, role, areaId } = body;

    if (!userProfileId) {
      return NextResponse.json({ error: 'User profile ID is required' }, { status: 400 });
    }

    // Validate role if provided
    const validRoles = ['superadmin', 'area sales manager', 'area sales supervisor'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (role) updateData.role = role;
    if (areaId !== undefined) updateData.area_id = areaId;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userProfileId)
      .select(`
        id,
        clerk_user_id,
        email,
        full_name,
        role,
        area_id,
        is_active,
        created_at,
        updated_at,
        master_areas(id, name, erp_id)
      `)
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin users PUT API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

export async function PATCH(request: Request) {
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
    const { userProfileId, isActive } = body;

    if (!userProfileId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'User profile ID and isActive (boolean) are required' }, { status: 400 });
    }

    // Update user active status
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userProfileId)
      .select(`
        id,
        clerk_user_id,
        email,
        full_name,
        role,
        area_id,
        is_active,
        created_at,
        updated_at,
        master_areas(id, name, erp_id)
      `)
      .single();

    if (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    const action = isActive ? 'activated' : 'deactivated';
    return NextResponse.json({ data, message: `User ${action} successfully` }, { status: 200 });
  } catch (error) {
    console.error('Admin users PATCH API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}