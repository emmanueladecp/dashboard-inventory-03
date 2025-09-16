'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Users, Edit, Save, X, Plus, MoreHorizontal, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name?: string;
  role: string;
  area_id?: number;
  is_active: boolean;
  master_areas?: {
    id: number;
    name: string;
    erp_id: number;
  };
}

interface Area {
  id: number;
  name: string;
  erp_id: number;
  is_active: boolean;
}

const ROLES = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'area sales manager', label: 'Area Sales Manager' },
  { value: 'area sales supervisor', label: 'Area Sales Supervisor' }
];

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'superadmin': return 'bg-purple-100 text-purple-800';
    case 'area sales manager': return 'bg-blue-100 text-blue-800';
    case 'area sales supervisor': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function UserManagementTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{role: string, areaId: number | null}>({role: '', areaId: null});
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<{email: string, fullName: string, areaId: number | null}>({email: '', fullName: '', areaId: null});
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, areasResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/areas')
        ]);
        
        if (!usersResponse.ok || !areasResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const [usersResult, areasResult] = await Promise.all([
          usersResponse.json(),
          areasResponse.json()
        ]);
        
        setUsers(usersResult.data);
        setAreas(areasResult.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditForm({
      role: user.role,
      areaId: user.area_id || null
    });
  };

  const handleSave = async (userId: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: userId,
          role: editForm.role,
          areaId: editForm.areaId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const result = await response.json();
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? result.data : user
      ));
      
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update user',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({role: '', areaId: null});
  };

  const handleAddUser = async () => {
    if (!addForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: addForm.email,
          fullName: addForm.fullName,
          areaId: addForm.areaId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const result = await response.json();
      
      // Add to local state
      setUsers([result.data, ...users]);
      
      setShowAddDialog(false);
      setAddForm({email: '', fullName: '', areaId: null});
      
      toast({
        title: "Success",
        description: `User created successfully. Temporary password: ${result.tempPassword}`,
      });
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create user',
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: userId,
          isActive: !currentStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const result = await response.json();
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? result.data : user
      ));
      
      const action = !currentStatus ? 'activated' : 'deactivated';
      toast({
        title: "Success",
        description: `User ${action} successfully`,
      });
    } catch (err) {
      console.error('Error updating user status:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update user status',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
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
          <CardTitle>User Management</CardTitle>
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
            <Users className="h-5 w-5 mr-2" />
            User Management
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input
                    id="user-name"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({...addForm, fullName: e.target.value})}
                    placeholder="Enter full name (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="user-area">Initial Area Assignment</Label>
                  <Select 
                    value={addForm.areaId?.toString() || ''} 
                    onValueChange={(value) => setAddForm({...addForm, areaId: value ? parseInt(value) : null})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Area</SelectItem>
                      {areas.filter(area => area.is_active).map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name} (ID: {area.erp_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setAddForm({email: '', fullName: '', areaId: null});
                    }}
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={adding}>
                    {adding ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Area Assignment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || 'No Name'}</span>
                        <span className="text-sm text-gray-500">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingUser === user.id ? (
                        <Select 
                          value={editForm.areaId?.toString() || ''} 
                          onValueChange={(value) => setEditForm({...editForm, areaId: value ? parseInt(value) : null})}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Area</SelectItem>
                            {areas.filter(area => area.is_active).map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name} (ID: {area.erp_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {user.master_areas ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{user.master_areas.name}</span>
                              <span className="text-xs text-gray-500">ID: {user.master_areas.erp_id}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No area assigned</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUser === user.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(user.id)}
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
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              className={user.is_active ? "text-red-600" : "text-green-600"}
                            >
                              {user.is_active ? (
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
        
        {users.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total users: {users.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}