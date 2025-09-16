'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertCircle, RefreshCw, Package } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  item: string;
  timestamp: string;
  type: 'update' | 'alert' | 'reorder' | 'sync';
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'update': 
      return <Package className="h-4 w-4 text-blue-600" />;
    case 'alert': 
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'reorder': 
      return <RefreshCw className="h-4 w-4 text-green-600" />;
    case 'sync':
      return <Clock className="h-4 w-4 text-purple-600" />;
    default: 
      return <Package className="h-4 w-4 text-gray-600" />;
  }
}

function getRelativeTime(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return past.toLocaleDateString();
}

export function RecentActivity() {
  const { user } = useUser();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since we don't have a real activity tracking system yet,
    // we'll generate some mock activities based on current user
    const generateMockActivities = () => {
      const currentUser = user ? `${user.firstName} ${user.lastName}` : 'System';
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          user: currentUser,
          action: 'Viewed dashboard',
          item: 'Inventory Overview',
          timestamp: new Date().toISOString(),
          type: 'sync'
        },
        {
          id: '2',
          user: 'System',
          action: 'Low stock detected',
          item: 'Copper Wire (5 units)',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          type: 'alert'
        },
        {
          id: '3',
          user: 'Area Manager',
          action: 'Stock level updated',
          item: 'Steel Bars',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          type: 'update'
        },
        {
          id: '4',
          user: 'System',
          action: 'Reorder recommendation',
          item: 'Plastic Granules',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          type: 'reorder'
        },
        {
          id: '5',
          user: currentUser,
          action: 'Profile synchronized',
          item: 'User Profile',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          type: 'sync'
        }
      ];
      
      setActivities(mockActivities);
      setLoading(false);
    };

    const timer = setTimeout(() => {
      generateMockActivities();
    }, 1000); // Simulate loading delay

    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          <span className="text-xs font-normal text-gray-500">
            Last 7 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm leading-tight">
                    <span className="font-medium text-gray-900">{activity.user}</span>
                    <span className="text-gray-600 ml-1">{activity.action}</span>
                  </p>
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {activity.item}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}