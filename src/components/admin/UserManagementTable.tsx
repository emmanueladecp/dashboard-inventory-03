'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { AlertCircle, Users, Edit, Save, X, Plus, MoreHorizontal, Eye, EyeOff, UserPlus, MapPin, RefreshCw } from 'lucide-react';
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

interface UserAreaMapping {
  id: number;
  user_profile_id: string;
  area_id: number;
  created_at: string;
  master_areas: {
    id: number;
    name: string;
    erp_id: number;
    is_active: boolean;
  };
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
  const [userAreaMappings, setUserAreaMappings] = useState<{[userId: string]: UserAreaMapping[]}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{role: string, areaId: number | null}>({role: '', areaId: null});
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<{username: string, email: string, fullName: string, areaId: number | null}>({username: '', email: '', fullName: '', areaId: null});
  const [adding, setAdding] = useState(false);
  const [showAreasDialog, setShowAreasDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [managingAreas, setManagingAreas] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { toast } = useToast();

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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
      
      // Fetch user-area mappings for all users
      const mappingsPromises = usersResult.data.map(async (user: UserProfile) => {
        const response = await fetch(`/api/admin/user-area-mappings?userProfileId=${user.id}`);
        if (response.ok) {
          const result = await response.json();
          return { userId: user.id, mappings: result.data };
        }
        return { userId: user.id, mappings: [] };
      });
      
      const mappingsResults = await Promise.all(mappingsPromises);
      const mappingsMap = mappingsResults.reduce((acc, { userId, mappings }) => {
        acc[userId] = mappings;
        return acc;
      }, {} as {[userId: string]: UserAreaMapping[]});
      
      setUserAreaMappings(mappingsMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

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
    if (!addForm.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
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
          username: addForm.username.trim(),
          email: addForm.email.trim() || null,
          fullName: addForm.fullName.trim() || null,
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
      setAddForm({username: '', email: '', fullName: '', areaId: null});
      
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
      
      // Use the message from the API response for better feedback
      toast({
        title: "Success",
        description: result.message || `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
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

  const handleManageAreas = (userId: string) => {
    setSelectedUserId(userId);
    setShowAreasDialog(true);
  };

  const handleAddAreaMapping = async (areaId: number) => {
    if (!selectedUserId) return;
    
    try {
      setManagingAreas(true);
      const response = await fetch('/api/admin/user-area-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: selectedUserId,
          areaId: areaId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add area mapping');
      }

      const result = await response.json();
      
      // Update local state
      setUserAreaMappings(prev => ({
        ...prev,
        [selectedUserId]: [...(prev[selectedUserId] || []), result.data]
      }));
      
      toast({
        title: "Success",
        description: "Area mapping added successfully",
      });
    } catch (err) {
      console.error('Error adding area mapping:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add area mapping',
        variant: "destructive",
      });
    } finally {
      setManagingAreas(false);
    }
  };

  const handleRemoveAreaMapping = async (areaId: number) => {
    if (!selectedUserId) return;
    
    try {
      setManagingAreas(true);
      const response = await fetch('/api/admin/user-area-mappings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfileId: selectedUserId,
          areaId: areaId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove area mapping');
      }
      
      // Update local state
      setUserAreaMappings(prev => ({
        ...prev,
        [selectedUserId]: (prev[selectedUserId] || []).filter(mapping => mapping.area_id !== areaId)
      }));
      
      toast({
        title: "Success",
        description: "Area mapping removed successfully",
      });
    } catch (err) {
      console.error('Error removing area mapping:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to remove area mapping',
        variant: "destructive",
      });
    } finally {
      setManagingAreas(false);
    }
  };

  // Pagination logic
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, pageSize]);

  const totalPages = Math.ceil(users.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setEditingUser(null); // Cancel any editing when changing pages
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    // Reset to first page when changing page size
    setCurrentPage(1);
    setEditingUser(null); // Cancel any editing when changing page size
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
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
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
                <div className="space-y-2">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={addForm.username}
                    onChange={(e) => setAddForm({...addForm, username: e.target.value})}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address (optional)</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    placeholder="Enter email address (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-name">Full Name (optional)</Label>
                  <Input
                    id="user-name"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({...addForm, fullName: e.target.value})}
                    placeholder="Enter full name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-area">Initial Area Assignment (optional)</Label>
                  <Select 
                    value={addForm.areaId?.toString() || 'none'} 
                    onValueChange={(value) => setAddForm({...addForm, areaId: value === 'none' ? null : parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Area</SelectItem>
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
                      setAddForm({username: '', email: '', fullName: '', areaId: null});
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
                  <TableHead>Area Assignments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
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
                          value={editForm.areaId?.toString() || 'none'} 
                          onValueChange={(value) => setEditForm({...editForm, areaId: value === 'none' ? null : parseInt(value)})}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Area</SelectItem>
                            {areas.filter(area => area.is_active).map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name} (ID: {area.erp_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {/* Show primary area from user profile */}
                          {user.master_areas && (
                            <div className="mb-2">
                              <Badge variant="outline" className="mr-1">
                                {user.master_areas.name} (Primary)
                              </Badge>
                            </div>
                          )}
                          
                          {/* Show additional areas from mappings */}
                          {userAreaMappings[user.id] && userAreaMappings[user.id].length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {userAreaMappings[user.id].map((mapping) => (
                                <Badge key={mapping.id} variant="secondary" className="text-xs">
                                  {mapping.master_areas.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            !user.master_areas && (
                              <span className="text-gray-500">No areas assigned</span>
                            )
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
                            <DropdownMenuItem onClick={() => handleManageAreas(user.id)}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Manage Areas
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={users.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[5, 10, 15]}
          />
        )}
      </CardContent>
      
      {/* Areas Management Dialog */}
      <Dialog open={showAreasDialog} onOpenChange={setShowAreasDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Manage Area Assignments</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6">
              {selectedUserId && (
                <>
                  {/* Current Area Assignments Section */}
                  <div>
                    <h4 className="font-medium mb-3 text-lg">Current Area Assignments</h4>
                    <div className="space-y-3">
                      {/* Show primary area */}
                      {users.find(u => u.id === selectedUserId)?.master_areas && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge variant="outline" className="w-fit">
                              {users.find(u => u.id === selectedUserId)?.master_areas?.name} (Primary)
                            </Badge>
                            <span className="text-sm text-gray-500">
                              ID: {users.find(u => u.id === selectedUserId)?.master_areas?.erp_id}
                            </span>
                          </div>
                          <span className="text-xs text-blue-600 sm:text-right">
                            Primary area cannot be removed here
                          </span>
                        </div>
                      )}
                      
                      {/* Show additional areas */}
                      {userAreaMappings[selectedUserId] && userAreaMappings[selectedUserId].length > 0 ? (
                        userAreaMappings[selectedUserId].map((mapping) => (
                          <div key={mapping.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <Badge variant="secondary" className="w-fit">
                                {mapping.master_areas.name}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                ID: {mapping.master_areas.erp_id}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveAreaMapping(mapping.area_id)}
                              disabled={managingAreas}
                              className="w-full sm:w-auto"
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      ) : (
                        !users.find(u => u.id === selectedUserId)?.master_areas && (
                          <p className="text-gray-500 italic text-center py-4">No additional areas assigned</p>
                        )
                      )}
                    </div>
                  </div>
                  
                  {/* Add New Area Assignment Section */}
                  <div>
                    <h4 className="font-medium mb-3 text-lg">Add New Area Assignment</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {areas
                        .filter(area => {
                          const user = users.find(u => u.id === selectedUserId);
                          const isAlreadyAssigned = userAreaMappings[selectedUserId]?.some(m => m.area_id === area.id);
                          const isPrimaryArea = user?.area_id === area.id;
                          return area.is_active && !isAlreadyAssigned && !isPrimaryArea;
                        })
                        .map((area) => (
                          <div key={area.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm sm:text-base">{area.name}</span>
                              <span className="text-sm text-gray-500">ID: {area.erp_id}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddAreaMapping(area.id)}
                              disabled={managingAreas}
                              className="w-full sm:w-auto"
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      
                      {areas.filter(area => {
                        const user = users.find(u => u.id === selectedUserId);
                        const isAlreadyAssigned = userAreaMappings[selectedUserId]?.some(m => m.area_id === area.id);
                        const isPrimaryArea = user?.area_id === area.id;
                        return area.is_active && !isAlreadyAssigned && !isPrimaryArea;
                      }).length === 0 && (
                        <p className="text-gray-500 italic text-center py-4">
                          No additional areas available to assign
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Fixed bottom section */}
          <div className="flex-shrink-0 pt-4 border-t mt-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAreasDialog(false);
                  setSelectedUserId(null);
                }}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}