'use client';

import { useState, useEffect } from 'react';
import { Package, Boxes, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StockCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  loading?: boolean;
}

interface OverviewData {
  totalRawMaterials: number;
  totalFinishedGoods: number;
  totalRawStock: number;
  totalFinishedStock: number;
  lowStockItems: number;
  userRole: string;
  userAreaId?: number;
}

function StockCard({ title, value, subtitle, icon: Icon, trend, loading }: StockCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StockCards() {
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

  // Calculate total stock value (mock calculation)
  const totalValue = overviewData 
    ? (overviewData.totalRawStock * 10) + (overviewData.totalFinishedStock * 25)
    : 0;

  const stockData = overviewData ? [
    {
      title: 'Total Raw Materials',
      value: overviewData.totalRawMaterials,
      subtitle: `${overviewData.totalRawStock} units in stock`,
      icon: Package,
      trend: { value: 12, label: 'from last month', isPositive: true }
    },
    {
      title: 'Finished Goods',
      value: overviewData.totalFinishedGoods,
      subtitle: `${overviewData.totalFinishedStock} ready for shipment`,
      icon: Boxes,
      trend: { value: 8, label: 'from last month', isPositive: true }
    },
    {
      title: 'Low Stock Items',
      value: overviewData.lowStockItems,
      subtitle: 'Need reordering',
      icon: AlertTriangle,
      trend: { value: 5, label: 'from last week', isPositive: false }
    },
    {
      title: 'Est. Total Value',
      value: `$${totalValue.toLocaleString()}`,
      subtitle: 'Current inventory value',
      icon: TrendingUp,
      trend: { value: 15, label: 'from last month', isPositive: true }
    }
  ] : [];

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6 text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Failed to load stock data: {error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading
        ? Array.from({ length: 4 }, (_, index) => (
            <StockCard key={index} title="" value="" subtitle="" icon={Package} loading={true} />
          ))
        : stockData.map((item, index) => (
            <StockCard key={index} {...item} />
          ))
      }
    </div>
  );
}