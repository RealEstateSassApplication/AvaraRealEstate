'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  Home,
  User,
  Clock,
  Bell,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface RentDetailsModalProps {
  rent: any;
  open: boolean;
  onClose: () => void;
  onMarkPaid?: (rentId: string) => Promise<void>;
  showActions?: boolean;
  userType?: 'host' | 'tenant';
}

export default function RentDetailsModal({
  rent,
  open,
  onClose,
  onMarkPaid,
  showActions = true,
  userType = 'host',
}: RentDetailsModalProps) {
  const [loading, setLoading] = useState(false);

  if (!rent) return null;

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return;

    setLoading(true);
    try {
      await onMarkPaid(rent._id);
      onClose();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gray-900';
      case 'paused':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-gray-300';
      default:
        return 'bg-gray-500';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Monthly';
      case 'weekly':
        return 'Weekly';
      case 'yearly':
        return 'Yearly';
      default:
        return frequency;
    }
  };

  const isOverdue = rent.nextDue && new Date(rent.nextDue) < new Date();
  const daysUntilDue = rent.nextDue
    ? Math.ceil((new Date(rent.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Rent Agreement Details</span>
          </DialogTitle>
          <DialogDescription>
            View and manage rent payment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(rent.status)} text-white capitalize`}>
              {rent.status}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Overdue</span>
              </Badge>
            )}
          </div>

          {/* Property Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <Home className="w-5 h-5 text-gray-700" />
              <span>Property</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-lg">
                {rent.property?.title || 'Property Title'}
              </div>
              {rent.property?.address && (
                <div className="text-sm text-gray-600">
                  {rent.property.address.street && `${rent.property.address.street}, `}
                  {rent.property.address.city && `${rent.property.address.city}, `}
                  {rent.property.address.district}
                </div>
              )}
              {rent.property?.type && (
                <Badge variant="outline" className="capitalize">
                  {rent.property.type}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Tenant Information */}
          {userType === 'host' && rent.tenant && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-700" />
                  <span>Tenant</span>
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="font-medium">
                    {rent.tenant?.name || 'Tenant Name'}
                  </div>
                  {rent.tenant?.email && (
                    <div className="text-sm text-gray-600">
                      Email: {rent.tenant.email}
                    </div>
                  )}
                  {rent.tenant?.phone && (
                    <div className="text-sm text-gray-600">
                      Phone: {rent.tenant.phone}
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-700" />
              <span>Payment Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-LK', {
                    style: 'currency',
                    currency: rent.currency || 'LKR',
                    minimumFractionDigits: 0,
                  }).format(rent.amount)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Frequency</div>
                <div className="text-xl font-semibold text-gray-900">
                  {getFrequencyLabel(rent.frequency)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Due Date Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-700" />
              <span>Due Date</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Next Payment Due</div>
                  <div className="text-xl font-bold text-gray-900">
                    {rent.nextDue
                      ? format(new Date(rent.nextDue), 'MMMM dd, yyyy')
                      : 'Not set'}
                  </div>
                  {!isOverdue && daysUntilDue >= 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {daysUntilDue === 0
                        ? 'Due today'
                        : daysUntilDue === 1
                          ? 'Due tomorrow'
                          : `Due in ${daysUntilDue} days`}
                    </div>
                  )}
                  {isOverdue && (
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Overdue by {Math.abs(daysUntilDue)} days
                    </div>
                  )}
                </div>
                {isOverdue ? (
                  <AlertCircle className="w-12 h-12 text-red-500" />
                ) : (
                  <Clock className="w-12 h-12 text-gray-500" />
                )}
              </div>
            </div>
          </div>

          {/* Reminder Information */}
          {(rent.remindersSent > 0 || rent.lastReminderAt) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <span>Reminders</span>
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reminders Sent</span>
                    <span className="font-semibold">{rent.remindersSent || 0}</span>
                  </div>
                  {rent.lastReminderAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Reminder</span>
                      <span className="font-semibold">
                        {format(new Date(rent.lastReminderAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {rent.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {rent.notes}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            {rent.createdAt && (
              <div>Created: {format(new Date(rent.createdAt), 'MMM dd, yyyy HH:mm')}</div>
            )}
            {rent.updatedAt && (
              <div>Last Updated: {format(new Date(rent.updatedAt), 'MMM dd, yyyy HH:mm')}</div>
            )}
          </div>

          {/* Actions */}
          {showActions && onMarkPaid && (
            <>
              <Separator />
              <div className="flex items-center justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={handleMarkPaid}
                  disabled={loading}
                  className="bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
