import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== Sync user API called ===');
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User ID:', userId);
    
    const user = await currentUser();
    
    if (!user) {
      console.log('❌ No current user found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract email - allow null/undefined (no validation needed)
    let email: string | null = null;
    try {
      email = user.emailAddresses?.[0]?.emailAddress || 
              user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress ||
              null;
    } catch (error) {
      console.warn('Could not extract email (this is OK):', error);
    }
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;

    console.log('📋 User data:', { userId, email: email || 'NULL', fullName: fullName || 'NULL' });

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError);
      return NextResponse.json({ 
        error: 'Database check error', 
        details: checkError,
        step: 'checking_existing_user'
      }, { status: 500 });
    }

    if (existingUser) {
      console.log('ℹ️ User already exists:', existingUser.id);
      return NextResponse.json({ 
        message: 'User already exists', 
        user: existingUser,
        action: 'found_existing'
      }, { status: 200 });
    }

    // Create user profile (no email validation - null is allowed)
    console.log('➕ Creating new user profile...');
    
    const insertData = {
      clerk_user_id: userId,
      email: email, // Can be null - no validation needed
      full_name: fullName,
      role: 'area sales supervisor' as const, // Default role
    };
    
    console.log('📤 Insert data:', insertData);
    
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user profile:', error);
      return NextResponse.json({ 
        error: 'Failed to create user profile', 
        details: error,
        userData: insertData,
        step: 'creating_user_profile'
      }, { status: 500 });
    }

    console.log('✅ User profile created successfully:', data.id);
    
    return NextResponse.json({ 
      message: 'User synced successfully', 
      user: data,
      action: 'created_new'
    }, { status: 201 });
  } catch (error: any) {
    console.error('💥 Sync user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}