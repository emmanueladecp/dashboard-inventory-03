import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Enhanced email extraction
    let email: string | undefined = email_addresses?.[0]?.email_address;
    
    // Fallback: find primary email
    if (!email) {
      const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id);
      email = primaryEmail?.email_address;
    }
    
    // Final fallback: any email
    if (!email && email_addresses?.length > 0) {
      email = email_addresses[0].email_address;
    }
    
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    console.log('Webhook user.created:', { id, email, fullName, email_addresses });

    // Validate email exists
    if (!email) {
      console.error('No email found in webhook data:', evt.data);
      return new Response('No email address found', { status: 400 });
    }

    try {
      // Insert user into Supabase
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          clerk_user_id: id,
          email: email,
          full_name: fullName || null,
          role: 'area sales supervisor', // Default role
        });

      if (error) {
        console.error('Error creating user profile via webhook:', error);
        return new Response('Error creating user profile', { status: 500 });
      }

      console.log('User profile created successfully via webhook for:', email);
    } catch (error) {
      console.error('Webhook database error:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Enhanced email extraction
    let email: string | undefined = email_addresses?.[0]?.email_address;
    
    if (!email) {
      const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id);
      email = primaryEmail?.email_address;
    }
    
    if (!email && email_addresses?.length > 0) {
      email = email_addresses[0].email_address;
    }
    
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    if (!email) {
      console.error('No email found in webhook update data:', evt.data);
      return new Response('No email address found', { status: 400 });
    }

    try {
      // Update user in Supabase
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          email: email,
          full_name: fullName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', id);

      if (error) {
        console.error('Error updating user profile via webhook:', error);
        return new Response('Error updating user profile', { status: 500 });
      }

      console.log('User profile updated successfully via webhook for:', email);
    } catch (error) {
      console.error('Webhook update database error:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      // Delete user from Supabase
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('clerk_user_id', id);

      if (error) {
        console.error('Error deleting user profile via webhook:', error);
        return new Response('Error deleting user profile', { status: 500 });
      }

      console.log('User profile deleted successfully via webhook for ID:', id);
    } catch (error) {
      console.error('Webhook delete database error:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}