'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface UserProfile {
  role: string;
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Raw Materials',
    href: '/inventory/raw-materials',
    icon: Package,
  },
  {
    name: 'Finished Goods',
    href: '/inventory/finished-goods',
    icon: Boxes,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['superadmin'],
  },
  {
    name: 'Area Management',
    href: '/admin/areas',
    icon: MapPin,
    roles: ['superadmin'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          const result = await response.json();
          setUserProfile(result.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Get user role - fallback to metadata or default
  const userRole = userProfile?.role || 
                   (user?.publicMetadata?.role as string) || 
                   'area sales supervisor';

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-gray-900 text-white transition-all duration-300",
        "md:relative md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b border-gray-700",
            collapsed && "justify-center"
          )}>
            {!collapsed && (
              <span className="text-lg font-semibold">Menu</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-white hover:bg-gray-700"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-gray-700 hover:text-white",
                    isActive ? "bg-gray-700 text-white" : "text-gray-300",
                    collapsed && "justify-center"
                  )}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          {!collapsed && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {profileLoading ? 'Loading...' : (
                      userRole === 'superadmin' ? 'Super Admin' :
                      userRole === 'area sales manager' ? 'Area Sales Manager' :
                      userRole === 'area sales supervisor' ? 'Area Sales Supervisor' :
                      userRole
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}