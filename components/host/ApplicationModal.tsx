"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Home,
  Briefcase,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MapPin
} from 'lucide-react';

interface Props {
  application: any;
  onClose?: () => void;
  onActionCompleted?: () => void;
}

export default function ApplicationModal({ application, onClose, onActionCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!application) return null;

  const handleAction = async (action: 'accept' | 'reject' | 'request-info', payload?: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${application._id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Action failed');
      } else {
        toast.success(`Application ${action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'updated'} successfully`);
        onActionCompleted?.();
        setOpen(false);
      }
    } catch (err) {
      console.error('Action error', err);
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return 'bg-gray-900 text-white';
      case 'rejected':
        return 'bg-gray-400 text-white';
      case 'pending':
        return 'bg-gray-600 text-white';
      case 'more_info':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rental Application Details</DialogTitle>
          <DialogDescription>
            Review the application and take action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Application ID: {application._id?.substring(0, 8)}...</span>
            </div>
            <Badge className={`${getStatusColor(application.status)} capitalize`}>
              {application.status?.replace('_', ' ')}
            </Badge>
          </div>

          <Separator />

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="w-5 h-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-lg font-semibold">{application.property?.title || 'Property'}</p>
                {application.property?.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      {application.property.address.street && `${application.property.address.street}, `}
                      {application.property.address.city}
                      {application.property.address.district && `, ${application.property.address.district}`}
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-600">Property Price</p>
                  <p className="font-medium">
                    {application.currency || 'LKR'} {application.property?.price?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property ID</p>
                  <p className="font-medium text-sm">{application.property?._id?.substring(0, 12)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{application.user?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-sm">{application.user?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{application.user?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employment Status</p>
                    <p className="font-medium capitalize">{application.employmentStatus || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Rental Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {application.currency || 'LKR'} {application.monthlyRent?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Rent</p>
                  <p className="text-lg font-semibold">
                    {application.currency || 'LKR'} {application.totalRent?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{application.durationMonths || 'N/A'} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {application.startDate ? new Date(application.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Occupants</p>
                  <p className="font-medium">{application.numberOfOccupants || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Has Pets</p>
                  <p className="font-medium">{application.hasPets ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(application.monthlyIncome || application.emergencyContactName || application.additionalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.monthlyIncome && (
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="font-medium">
                      {application.currency || 'LKR'} {application.monthlyIncome?.toLocaleString()}
                    </p>
                  </div>
                )}
                {application.emergencyContactName && (
                  <div>
                    <p className="text-sm text-gray-600">Emergency Contact</p>
                    <p className="font-medium">{application.emergencyContactName}</p>
                    {application.emergencyContactPhone && (
                      <p className="text-sm text-gray-500">{application.emergencyContactPhone}</p>
                    )}
                  </div>
                )}
                {application.additionalNotes && (
                  <div>
                    <p className="text-sm text-gray-600">Additional Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{application.additionalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {application.status === 'pending' && (
              <>
                <Button
                  size="default"
                  className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none"
                  onClick={() => handleAction('accept')}
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Application
                </Button>
                <Button
                  size="default"
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                  onClick={() => handleAction('reject', { reason: 'Not suitable' })}
                  disabled={loading}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => handleAction('request-info', { request: 'Please provide proof of income' })}
                  disabled={loading}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Request Info
                </Button>
              </>
            )}
            <div className="flex-1" />
            <Button
              size="default"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>

          {/* Submission Timestamp */}
          <div className="text-center text-sm text-gray-500">
            Submitted on {new Date(application.submittedAt || application.createdAt).toLocaleString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
