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

// Define payload for Clerk user creation instead of using any
interface ClerkUserCreatePayload {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  skip_password_checks?: boolean;
  skip_password_requirement?: boolean;
  email_address?: string[];
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
    const { username, email, fullName, areaId } = body as { username: string; email?: string; fullName?: string; areaId?: number };

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Create user in Clerk using Clerk Backend API
    const clerkUserData: ClerkUserCreatePayload = {
      username: username.trim(),
      password: 'newUserInv@2025',
      first_name: fullName?.split(' ')[0] || '',
      last_name: fullName?.split(' ').slice(1).join(' ') || '',
      skip_password_checks: true,
      skip_password_requirement: false
    };

    // Add email only if provided
    if (email && email.trim()) {
      clerkUserData.email_address = [email.trim()];
    }
    const clerkResponse = await fetch('https://api.clerk.dev/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clerkUserData),
    });

    if (!clerkResponse.ok) {
      const clerkError = await clerkResponse.json();
      console.error('Clerk user creation error:', clerkError);
      return NextResponse.json({ 
        error: `Failed to create user in Clerk: ${clerkError.errors?.[0]?.message || 'Unknown error'}` 
      }, { status: 400 });
    }

    const clerkUser = await clerkResponse.json();

    // Create user profile in Supabase
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        clerk_user_id: clerkUser.id,
        email: email?.trim() || null,
        full_name: fullName?.trim() || null,
        role: 'area sales supervisor',
        area_id: areaId || null,
        is_active: true
      })
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
      console.error('Error creating user profile:', error);
      
      // If Supabase insert fails, we should try to delete the Clerk user to maintain consistency
      try {
        await fetch(`https://api.clerk.dev/v1/users/${clerkUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup Clerk user after Supabase error:', cleanupError);
      }
      
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      message: 'User created successfully',
      tempPassword: 'newUserInv@2025'
    }, { status: 201 });
  } catch (error) {
    console.error('Create user API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}