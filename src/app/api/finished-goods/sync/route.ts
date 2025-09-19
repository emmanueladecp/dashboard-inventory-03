import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchFinishedGoodsFromIDempiere, IDempiereAPIError } from '@/lib/idempiere-api';

/**
 * GET /api/finished-goods/sync
 * Fetch finished goods data from iDempiere API
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access finished goods.' },
        { status: 401 }
      );
    }

    // Fetch data from iDempiere
    const finishedGoodsData = await fetchFinishedGoodsFromIDempiere();

    // Return the data
    return NextResponse.json(finishedGoodsData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error in finished goods sync API:', error);

    if (error instanceof IDempiereAPIError) {
      return NextResponse.json(
        { 
          error: error.message,
          details: error.response ? 'Check server logs for details' : undefined
        },
        { status: error.status || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error occurred while fetching finished goods' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finished-goods/sync
 * Manually trigger sync of finished goods data
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to sync finished goods.' },
        { status: 401 }
      );
    }

    // Fetch fresh data from iDempiere
    const finishedGoodsData = await fetchFinishedGoodsFromIDempiere();

    // Return success response with data
    return NextResponse.json({
      message: 'Finished goods sync completed successfully',
      data: finishedGoodsData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in finished goods manual sync:', error);

    if (error instanceof IDempiereAPIError) {
      return NextResponse.json(
        { 
          error: `Sync failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error occurred during sync',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}