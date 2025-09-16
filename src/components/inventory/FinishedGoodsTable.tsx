'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Box, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FinishedGood {
  id: number;
  name: string;
  erp_id: number;
  current_stock: number;
  unit: string;
  area_id: number;
  master_areas: {
    id: number;
    name: string;
    erp_id: number;
  };
}

function getStockStatus(stock: number) {
  if (stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  if (stock < 50) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
  if (stock < 100) return { status: 'Medium Stock', color: 'bg-blue-100 text-blue-800' };
  return { status: 'Good Stock', color: 'bg-green-100 text-green-800' };
}

export function FinishedGoodsTable() {
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [filteredGoods, setFilteredGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFinishedGoods = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inventory/finished-goods');
        
        if (!response.ok) {
          throw new Error('Failed to fetch finished goods');
        }
        
        const result = await response.json();
        setFinishedGoods(result.data);
        setFilteredGoods(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching finished goods:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinishedGoods();
  }, []);

  useEffect(() => {
    const filtered = finishedGoods.filter(good =>
      good.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      good.master_areas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      good.erp_id.toString().includes(searchTerm)
    );
    setFilteredGoods(filtered);
  }, [searchTerm, finishedGoods]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finished Goods Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finished Goods Inventory</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center">
            <Box className="h-5 w-5 mr-2" />
            Finished Goods Inventory
          </CardTitle>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search goods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredGoods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Box className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No finished goods found</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'No goods have been added yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>ERP ID</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoods.map((good) => {
                  const stockStatus = getStockStatus(good.current_stock);
                  return (
                    <TableRow key={good.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{good.name}</TableCell>
                      <TableCell>{good.erp_id}</TableCell>
                      <TableCell className="font-mono">{good.current_stock}</TableCell>
                      <TableCell>{good.unit}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{good.master_areas.name}</span>
                          <span className="text-xs text-gray-500">ID: {good.master_areas.erp_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredGoods.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredGoods.length} of {finishedGoods.length} goods
          </div>
        )}
      </CardContent>
    </Card>
  );
}