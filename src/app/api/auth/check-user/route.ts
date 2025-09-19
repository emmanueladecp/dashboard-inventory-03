import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in database
    const { data: existingUser, error: checkError } = await supabaseAdmin
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

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json({ 
        error: 'Database check error', 
        details: checkError
      }, { status: 500 });
    }

    if (!existingUser) {
      return NextResponse.json({ 
        exists: false,
        message: 'User not found in database'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      exists: true,
      user: existingUser
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Check user API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}