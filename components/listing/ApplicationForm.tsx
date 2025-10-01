"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface Props {
  propertyId: string;
  monthlyRent: number;
  onSubmitted?: () => void;
}

export default function ApplicationForm({ propertyId, monthlyRent, onSubmitted }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [dob, setDob] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);
  const [occupants, setOccupants] = useState(1);
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !email || !startDate) {
      toast({ title: 'Please fill required fields' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          startDate,
          durationMonths,
          monthlyRent,
          numberOfOccupants: occupants,
          employmentStatus,
          monthlyIncome,
          emergencyContactName: fullName,
          emergencyContactPhone: phone,
          additionalNotes: `Applicant: ${fullName}, address: ${currentAddress}`
        })
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: json?.error || 'Failed to submit application' });
      } else {
        toast({ title: 'Application submitted', description: 'Your rental application has been sent to the host.' });
        onSubmitted?.();
      }
    } catch (err) {
      console.error('Application submit error', err);
      toast({ title: 'Network error', description: 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Application Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Full name</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" />
        </div>

        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
        </div>
        <div>
          <Label>Current address</Label>
          <Input value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} placeholder="Current address" />
        </div>

        <div>
          <Label>Date of birth</Label>
          <Input value={dob} onChange={e => setDob(e.target.value)} type="date" />
        </div>
        <div>
          <Label>Desired start date</Label>
          <Input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" />
        </div>

        <div>
          <Label>Duration (months)</Label>
          <Select value={String(durationMonths)} onValueChange={(v: string) => setDurationMonths(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">1 year</SelectItem>
                <SelectItem value="24">2 years</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Occupants</Label>
          <Input type="number" value={String(occupants)} onChange={e => setOccupants(Number(e.target.value))} />
        </div>
        <div>
          <Label>Employment status</Label>
          <Input value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)} placeholder="e.g., Employed, Student" />
        </div>

        <div>
          <Label>Monthly income (optional)</Label>
          <Input value={monthlyIncome === '' ? '' : String(monthlyIncome)} onChange={e => setMonthlyIncome(e.target.value ? Number(e.target.value) : '')} type="number" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="text-lg font-bold">{monthlyRent} × {durationMonths} = {monthlyRent * durationMonths}</div>
      </div>

      <div className="mt-4">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
}
