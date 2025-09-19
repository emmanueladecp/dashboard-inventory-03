import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error, count } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('Database connection error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }, { status: 500 });
    }

    // Analyze email status
    const usersWithEmail = data?.filter(u => u.email) || [];
    const usersWithoutEmail = data?.filter(u => !u.email) || [];

    return NextResponse.json({ 
      message: 'Database connection successful',
      totalUsers: count,
      usersWithEmail: usersWithEmail.length,
      usersWithoutEmail: usersWithoutEmail.length,
      sampleUsers: data?.map(u => ({
        id: u.id,
        clerk_user_id: u.clerk_user_id,
        email: u.email || 'NULL',
        full_name: u.full_name || 'NULL',
        role: u.role
      })),
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      emailPolicy: 'Email can be NULL - this is expected and OK'
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Test DB API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}