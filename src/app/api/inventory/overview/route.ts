import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role and area
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, area_id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch overview data based on user role
    let rawMaterialsQuery = supabaseAdmin
      .from('raw_materials')
      .select('id, current_stock, area_id');
    
    let finishedGoodsQuery = supabaseAdmin
      .from('finished_goods')
      .select('id, current_stock, area_id');

    // Apply area filtering for non-superadmin users
    if (userProfile.role !== 'superadmin' && userProfile.area_id) {
      rawMaterialsQuery = rawMaterialsQuery.eq('area_id', userProfile.area_id);
      finishedGoodsQuery = finishedGoodsQuery.eq('area_id', userProfile.area_id);
    }

    const [rawMaterialsResult, finishedGoodsResult] = await Promise.all([
      rawMaterialsQuery,
      finishedGoodsQuery
    ]);

    if (rawMaterialsResult.error) {
      console.error('Error fetching raw materials overview:', rawMaterialsResult.error);
      return NextResponse.json({ error: 'Failed to fetch raw materials data' }, { status: 500 });
    }

    if (finishedGoodsResult.error) {
      console.error('Error fetching finished goods overview:', finishedGoodsResult.error);
      return NextResponse.json({ error: 'Failed to fetch finished goods data' }, { status: 500 });
    }

    // Calculate overview statistics
    const rawMaterials = rawMaterialsResult.data || [];
    const finishedGoods = finishedGoodsResult.data || [];

    const totalRawMaterials = rawMaterials.length;
    const totalFinishedGoods = finishedGoods.length;
    const totalRawStock = rawMaterials.reduce((sum, item) => sum + (item.current_stock || 0), 0);
    const totalFinishedStock = finishedGoods.reduce((sum, item) => sum + (item.current_stock || 0), 0);

    // Calculate low stock items (less than 50 units)
    const lowStockRaw = rawMaterials.filter(item => (item.current_stock || 0) < 50).length;
    const lowStockFinished = finishedGoods.filter(item => (item.current_stock || 0) < 50).length;

    const overview = {
      totalRawMaterials,
      totalFinishedGoods,
      totalRawStock,
      totalFinishedStock,
      lowStockItems: lowStockRaw + lowStockFinished,
      userRole: userProfile.role,
      userAreaId: userProfile.area_id
    };

    return NextResponse.json({ data: overview }, { status: 200 });
  } catch (error) {
    console.error('Inventory overview API error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}