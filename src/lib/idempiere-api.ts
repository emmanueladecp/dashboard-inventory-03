/**
 * API utilities for fetching finished goods data from iDempiere
 */

import { FinishedGoodsResponse } from './indexeddb';

export interface IDempiereErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export class IDempiereAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response | IDempiereErrorResponse
  ) {
    super(message);
    this.name = 'IDempiereAPIError';
  }
}

/**
 * Fetch finished goods data from iDempiere API
 */
export async function fetchFinishedGoodsFromIDempiere(): Promise<FinishedGoodsResponse> {
  const idempiereUrl = process.env.NEXT_IDEMPIERE_URL;
  const token = process.env.IDEMPIERE_TOKEN;

  if (!idempiereUrl || !token) {
    throw new IDempiereAPIError(
      'Missing iDempiere configuration. Please check NEXT_IDEMPIERE_URL and IDEMPIERE_TOKEN environment variables.',
      500
    );
  }

  const apiUrl = `${idempiereUrl}/api/v1/models/vw_product_fg`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData: IDempiereErrorResponse = await response.json();
        errorMessage = (errorData.message as string) || (errorData.error as string) || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new IDempiereAPIError(
        `Failed to fetch finished goods from iDempiere: ${errorMessage}`,
        response.status,
        response
      );
    }

    const data: FinishedGoodsResponse = await response.json();

    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new IDempiereAPIError('Invalid response format from iDempiere API');
    }

    if (!Array.isArray(data.records)) {
      throw new IDempiereAPIError('Invalid response format: records field is not an array');
    }

    // Log successful fetch for debugging
    console.log(`Successfully fetched ${data.records.length} finished goods from iDempiere`);

    return data;
  } catch (error) {
    if (error instanceof IDempiereAPIError) {
      throw error;
    }

    // Handle network errors, timeouts, etc.
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new IDempiereAPIError('Request timeout: iDempiere API did not respond within 30 seconds');
      }
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new IDempiereAPIError('Network error: Cannot connect to iDempiere API. Please check the URL and network connection.');
      }

      throw new IDempiereAPIError(`Unexpected error fetching from iDempiere: ${error.message}`);
    }

    throw new IDempiereAPIError('Unknown error occurred while fetching finished goods');
  }
}

/**
 * Client-side fetch function for finished goods
 * This will be called from React components
 */
export async function fetchFinishedGoodsClient(): Promise<FinishedGoodsResponse> {
  try {
    const response = await fetch('/api/finished-goods/sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new IDempiereAPIError(
        `Failed to fetch finished goods: ${errorMessage}`,
        response.status
      );
    }

    const data: FinishedGoodsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof IDempiereAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new IDempiereAPIError(`Client fetch error: ${error.message}`);
    }

    throw new IDempiereAPIError('Unknown error occurred while fetching finished goods');
  }
}

/**
 * Utility function to test iDempiere API connectivity
 */
export async function testIDempiereConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  try {
    await fetchFinishedGoodsFromIDempiere();
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Successfully connected to iDempiere API',
      latency
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof IDempiereAPIError ? error.message : 'Unknown connection error'
    };
  }
}