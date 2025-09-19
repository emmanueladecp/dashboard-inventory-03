'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { AlertCircle, MapPin, Plus, Edit, Save, X, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface Area {
  id: number;
  name: string;
  erp_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AreaManagementTable() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{name: string, erpId: string}>({name: '', erpId: ''});
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<{name: string, erpId: string}>({name: '', erpId: ''});
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/areas');
        
        if (!response.ok) {
          throw new Error('Failed to fetch areas');
        }
        
        const result = await response.json();
        setAreas(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching areas:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const handleEdit = (area: Area) => {
    setEditingArea(area.id);
    setEditForm({
      name: area.name,
      erpId: area.erp_id.toString()
    });
  };

  const handleSave = async (areaId: number) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/areas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: areaId,
          name: editForm.name,
          erpId: parseInt(editForm.erpId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update area');
      }

      const result = await response.json();
      
      // Update the local state
      setAreas(areas.map(area => 
        area.id === areaId ? result.data : area
      ));
      
      setEditingArea(null);
      toast({
        title: "Success",
        description: "Area updated successfully",
      });
    } catch (err) {
      console.error('Error updating area:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update area',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingArea(null);
    setEditForm({name: '', erpId: ''});
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.erpId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.name,
          erpId: parseInt(addForm.erpId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create area');
      }

      const result = await response.json();
      
      // Add to local state
      setAreas([...areas, result.data]);
      
      setShowAddDialog(false);
      setAddForm({name: '', erpId: ''});
      
      toast({
        title: "Success",
        description: "Area created successfully",
      });
    } catch (err) {
      console.error('Error creating area:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create area',
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  // Pagination logic
  const paginatedAreas = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return areas.slice(startIndex, endIndex);
  }, [areas, currentPage, pageSize]);

  const totalPages = Math.ceil(areas.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setEditingArea(null); // Cancel any editing when changing pages
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    // Reset to first page when changing page size
    setCurrentPage(1);
    setEditingArea(null); // Cancel any editing when changing page size
  };

  const handleToggleStatus = async (areaId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/areas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: areaId,
          isActive: !currentStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update area status');
      }

      const result = await response.json();
      
      // Update the local state
      setAreas(areas.map(area => 
        area.id === areaId ? result.data : area
      ));
      
      const action = !currentStatus ? 'activated' : 'deactivated';
      toast({
        title: "Success",
        description: `Area ${action} successfully`,
      });
    } catch (err) {
      console.error('Error updating area status:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update area status',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-24" />
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
          <CardTitle>Area Management</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Area Management
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Area
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Area</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="area-name">Area Name</Label>
                  <Input
                    id="area-name"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    placeholder="Enter area name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area-erp-id">ERP ID</Label>
                  <Input
                    id="area-erp-id"
                    type="number"
                    value={addForm.erpId}
                    onChange={(e) => setAddForm({...addForm, erpId: e.target.value})}
                    placeholder="Enter ERP ID"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setAddForm({name: '', erpId: ''});
                    }}
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={adding}>
                    {adding ? 'Creating...' : 'Create Area'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {areas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No areas found</p>
            <p className="text-sm">Click &quot;Add Area&quot; to create your first area</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name</TableHead>
                  <TableHead>ERP ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAreas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-gray-50">
                    <TableCell>
                      {editingArea === area.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-48"
                        />
                      ) : (
                        <span className="font-medium">{area.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingArea === area.id ? (
                        <Input
                          type="number"
                          value={editForm.erpId}
                          onChange={(e) => setEditForm({...editForm, erpId: e.target.value})}
                          className="w-32"
                        />
                      ) : (
                        <span className="font-mono">{area.erp_id}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.is_active ? "default" : "secondary"}>
                        {area.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(area.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingArea === area.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(area.id)}
                            disabled={saving}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(area)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(area.id, area.is_active)}
                              className={area.is_active ? "text-red-600" : "text-green-600"}
                            >
                              {area.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {areas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={areas.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[5, 10, 15]}
          />
        )}
      </CardContent>
    </Card>
  );
}