'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
  id: number;
  name: string;
  category: 'raw_material' | 'finished_good';
  currentStock: number;
  unit: string;
  status: 'good' | 'low' | 'critical';
  area: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'good': return 'bg-green-100 text-green-800';
    case 'low': return 'bg-yellow-100 text-yellow-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function InventoryOverview() {
  // Mock data - replace with real API call
  const inventoryItems: InventoryItem[] = [
    {
      id: 1,
      name: 'Steel Rods',
      category: 'raw_material',
      currentStock: 150,
      unit: 'kg',
      status: 'good',
      area: 'North Region'
    },
    {
      id: 2,
      name: 'Motor Assembly',
      category: 'finished_good',
      currentStock: 25,
      unit: 'pieces',
      status: 'low',
      area: 'North Region'
    },
    {
      id: 3,
      name: 'Copper Wire',
      category: 'raw_material',
      currentStock: 5,
      unit: 'meters',
      status: 'critical',
      area: 'South Region'
    },
    {
      id: 4,
      name: 'Control Panel',
      category: 'finished_good',
      currentStock: 40,
      unit: 'pieces',
      status: 'good',
      area: 'East Region'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inventoryItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  {item.category === 'raw_material' ? 'Raw Material' : 'Finished Good'} • {item.area}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.currentStock} {item.unit}</p>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}