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

    // Fetch all areas (including inactive ones for superadmin)
    const { data, error } = await supabaseAdmin
      .from('master_areas')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching areas:', error);
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Admin areas API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

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
    const { name, erpId } = body;

    if (!name || !erpId) {
      return NextResponse.json({ error: 'Name and ERP ID are required' }, { status: 400 });
    }

    // Create new area (is_active defaults to true)
    const { data, error } = await supabaseAdmin
      .from('master_areas')
      .insert({
        name,
        erp_id: erpId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating area:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'ERP ID already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create area' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Area created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Admin areas POST API error:', error);
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
    const { id, name, erpId } = body;

    if (!id || !name || !erpId) {
      return NextResponse.json({ error: 'ID, name and ERP ID are required' }, { status: 400 });
    }

    // Update area
    const { data, error } = await supabaseAdmin
      .from('master_areas')
      .update({
        name,
        erp_id: erpId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating area:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'ERP ID already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update area' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Area updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin areas PUT API error:', error);
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
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'ID and isActive (boolean) are required' }, { status: 400 });
    }

    // Update area active status
    const { data, error } = await supabaseAdmin
      .from('master_areas')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating area status:', error);
      return NextResponse.json({ error: 'Failed to update area status' }, { status: 500 });
    }

    const action = isActive ? 'activated' : 'deactivated';
    return NextResponse.json({ data, message: `Area ${action} successfully` }, { status: 200 });
  } catch (error) {
    console.error('Admin areas PATCH API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}