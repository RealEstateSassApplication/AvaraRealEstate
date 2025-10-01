"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  _id: string;
  type: string;
  message: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

interface Props {
  userId: string;
}

export default function NotificationPanel({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const url = `/api/notifications?userId=${userId}${showUnreadOnly ? '&unreadOnly=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [userId, showUnreadOnly]);

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return '📝';
      case 'application_accepted':
        return '✅';
      case 'application_rejected':
        return '❌';
      case 'application_more_info':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Your recent activity and updates</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showUnreadOnly ? 'default' : 'outline'}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.metadata?.applicationId && (
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 h-auto mt-1"
                            onClick={() => {
                              // Navigate to applications tab
                              window.location.hash = 'applications';
                            }}
                          >
                            View application →
                          </Button>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification._id)}
                        className="ml-2"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
