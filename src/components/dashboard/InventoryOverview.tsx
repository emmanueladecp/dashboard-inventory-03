'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package, Box } from 'lucide-react';

interface OverviewData {
  totalRawMaterials: number;
  totalFinishedGoods: number;
  totalRawStock: number;
  totalFinishedStock: number;
  lowStockItems: number;
  userRole: string;
  userAreaId?: number;
}

function getStockStatus(count: number) {
  if (count === 0) return { status: 'critical', color: 'bg-red-100 text-red-800' };
  if (count < 50) return { status: 'low', color: 'bg-yellow-100 text-yellow-800' };
  return { status: 'good', color: 'bg-green-100 text-green-800' };
}

export function InventoryOverview() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inventory/overview');
        
        if (!response.ok) {
          throw new Error('Failed to fetch overview data');
        }
        
        const result = await response.json();
        setOverviewData(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching overview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overviewData) {
    return null;
  }

  const rawStockStatus = getStockStatus(overviewData.totalRawStock);
  const finishedStockStatus = getStockStatus(overviewData.totalFinishedStock);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Inventory Overview</span>
          <Badge variant="outline" className="text-xs">
            {overviewData.userRole === 'superadmin' ? 'All Areas' : 'Your Area'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Raw Materials */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Raw Materials</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{overviewData.totalRawMaterials}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{overviewData.totalRawStock} units</span>
              <Badge className={rawStockStatus.color}>
                {rawStockStatus.status}
              </Badge>
            </div>
          </div>

          {/* Finished Goods */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Box className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Finished Goods</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{overviewData.totalFinishedGoods}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{overviewData.totalFinishedStock} units</span>
              <Badge className={finishedStockStatus.color}>
                {finishedStockStatus.status}
              </Badge>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Low Stock Alert</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">{overviewData.lowStockItems}</p>
              <p className="text-sm text-gray-500">Items Below 50</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Needs Attention</span>
              <Badge className={overviewData.lowStockItems > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {overviewData.lowStockItems > 0 ? 'Action Required' : 'All Good'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}