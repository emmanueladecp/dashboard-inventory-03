'use client';

import { Package, Boxes, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

function StockCard({ title, value, subtitle, icon: Icon, trend }: StockCardProps) {
  return (
    <Card>
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
  // These would come from your API in a real app
  const stockData = [
    {
      title: 'Total Raw Materials',
      value: 1247,
      subtitle: 'Items in stock',
      icon: Package,
      trend: { value: 12, label: 'from last month', isPositive: true }
    },
    {
      title: 'Finished Goods',
      value: 892,
      subtitle: 'Ready for shipment',
      icon: Boxes,
      trend: { value: 8, label: 'from last month', isPositive: true }
    },
    {
      title: 'Low Stock Items',
      value: 23,
      subtitle: 'Need reordering',
      icon: AlertTriangle,
      trend: { value: 5, label: 'from last week', isPositive: false }
    },
    {
      title: 'Total Value',
      value: '$125,430',
      subtitle: 'Current inventory value',
      icon: TrendingUp,
      trend: { value: 15, label: 'from last month', isPositive: true }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stockData.map((item, index) => (
        <StockCard key={index} {...item} />
      ))}
    </div>
  );
}