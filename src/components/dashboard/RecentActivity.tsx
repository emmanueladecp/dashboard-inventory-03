'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  item: string;
  timestamp: string;
  type: 'update' | 'alert' | 'reorder';
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'update': return '📝';
    case 'alert': return '⚠️';
    case 'reorder': return '🔄';
    default: return '📋';
  }
}

export function RecentActivity() {
  // Mock data - replace with real API call
  const activities: ActivityItem[] = [
    {
      id: 1,
      user: 'John Doe',
      action: 'Updated stock level',
      item: 'Steel Rods',
      timestamp: '2 hours ago',
      type: 'update'
    },
    {
      id: 2,
      user: 'System',
      action: 'Low stock alert',
      item: 'Copper Wire',
      timestamp: '4 hours ago',
      type: 'alert'
    },
    {
      id: 3,
      user: 'Jane Smith',
      action: 'Reorder requested',
      item: 'Motor Assembly',
      timestamp: '1 day ago',
      type: 'reorder'
    },
    {
      id: 4,
      user: 'Mike Johnson',
      action: 'Added new item',
      item: 'Control Panel',
      timestamp: '2 days ago',
      type: 'update'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="text-lg">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  {activity.action}
                </p>
                <p className="text-sm font-medium text-blue-600">{activity.item}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}