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

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    type UpdatePayload = Partial<{
      full_name: string;
      role: string;
      area_id: number | null;
      is_active: boolean;
      email: string | null;
    }>;
    const updateData: UpdatePayload = body as UpdatePayload;

    if (!updateData) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const targetClerkUserId = searchParams.get('clerkUserId');

    if (!targetClerkUserId) {
      return NextResponse.json({ error: 'Missing clerkUserId parameter' }, { status: 400 });
    }

    const hasAccess = await checkSuperadminAccess(userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('clerk_user_id', targetClerkUserId)
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
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'User updated successfully' });
  } catch (error: unknown) {
    console.error('Update user API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Get user's Clerk ID before updating Supabase
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('clerk_user_id')
      .eq('id', userProfileId)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status in Clerk
    try {
      const clerkAction = isActive ? 'unlock' : 'lock';
      const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${userData.clerk_user_id}/${clerkAction}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!clerkResponse.ok) {
        const clerkError = await clerkResponse.json();
        console.error(`Clerk user ${clerkAction} error:`, clerkError);
        return NextResponse.json({ 
          error: `Failed to ${clerkAction} user in Clerk: ${clerkError.errors?.[0]?.message || 'Unknown error'}` 
        }, { status: 400 });
      }
    } catch (clerkError) {
      console.error(`Error ${isActive ? 'unlocking' : 'locking'} user in Clerk:`, clerkError);
      return NextResponse.json({ 
        error: `Failed to ${isActive ? 'unlock' : 'lock'} user in Clerk` 
      }, { status: 500 });
    }

    // Update user active status in Supabase
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
    const clerkAction = isActive ? 'unlocked' : 'locked';
    return NextResponse.json({ 
      data, 
      message: `User ${action} successfully in Supabase and ${clerkAction} in Clerk` 
    }, { status: 200 });
  } catch (error) {
    console.error('Admin users PATCH API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}