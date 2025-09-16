import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clerkUserId, newRole } = body;

    if (!clerkUserId || !newRole) {
      return NextResponse.json({ error: 'Clerk user ID and new role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['superadmin', 'area sales manager', 'area sales supervisor'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Force change the user role
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: newRole })
      .eq('clerk_user_id', clerkUserId)
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
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data, 
      message: `User role changed to ${newRole} successfully` 
    }, { status: 200 });
  } catch (error) {
    console.error('Force role change API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}