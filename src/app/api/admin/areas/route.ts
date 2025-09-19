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

    // If area is being deactivated, clean up user-area mappings and check for user deactivation
    if (!isActive) {
      // STEP 1: Remove all user-area mappings that reference this deactivated area
      const { error: mappingDeleteError } = await supabaseAdmin
        .from('user_area_mappings')
        .delete()
        .eq('area_id', id);

      if (mappingDeleteError) {
        console.error('Error removing user-area mappings:', mappingDeleteError);
      } else {
        console.log(`Removed all user-area mappings for deactivated area ${id}`);
      }

      // STEP 2: Check which users would have NO remaining active areas and need deactivation
      // Find users who have this area as primary area
      const { data: primaryAreaUsers, error: primaryError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, clerk_user_id, email, area_id')
        .eq('area_id', id)
        .eq('is_active', true);

      if (primaryError) {
        console.error('Error fetching users with primary area:', primaryError);
      } else if (primaryAreaUsers && primaryAreaUsers.length > 0) {
        const usersToDeactivate = [];
        
        // For each user who had this as primary area, check if they have other active areas
        for (const user of primaryAreaUsers) {
          let hasOtherActiveAreas = false;
          
          // Check if they have other active areas in mappings (after we removed the deactivated area mappings)
          const { data: otherMappings } = await supabaseAdmin
            .from('user_area_mappings')
            .select(`
              area_id,
              master_areas!inner(is_active)
            `)
            .eq('user_profile_id', user.id);
          
          type OtherMapping = { area_id: number; master_areas: { is_active: boolean } };
          if (otherMappings && (otherMappings as OtherMapping[]).some((mapping: OtherMapping) => mapping.master_areas?.is_active)) {
            hasOtherActiveAreas = true;
          }
          
          // If user has no other active areas, mark for deactivation
          if (!hasOtherActiveAreas) {
            usersToDeactivate.push(user);
          }
        }
        
        // Deactivate users who have no remaining active areas
        if (usersToDeactivate.length > 0) {
          const userIds = usersToDeactivate.map(u => u.id);
          
          // Deactivate users in Supabase
          const { error: userUpdateError } = await supabaseAdmin
            .from('user_profiles')
            .update({ is_active: false })
            .in('id', userIds)
            .eq('is_active', true);

          if (userUpdateError) {
            console.error('Error deactivating users:', userUpdateError);
          } else {
            // Also deactivate users in Clerk
            for (const user of usersToDeactivate) {
              try {
                const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${user.clerk_user_id}/lock`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (!clerkResponse.ok) {
                  const clerkError = await clerkResponse.json();
                  console.error(`Clerk user lock error for ${user.email}:`, clerkError);
                }
              } catch (clerkError) {
                console.error(`Error locking user ${user.email} in Clerk:`, clerkError);
              }
            }
            
            console.log(`Deactivated ${usersToDeactivate.length} users who had no remaining active areas`);
          }
        }
      }
    }

    const action = isActive ? 'activated' : 'deactivated';
    const message = !isActive 
      ? `Area ${action} successfully. All user assignments to this area have been removed and users with no remaining active areas have been deactivated.`
      : `Area ${action} successfully`;
    
    return NextResponse.json({ data, message }, { status: 200 });
  } catch (error) {
    console.error('Admin areas PATCH API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}