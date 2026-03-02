'use client';
import { useState } from 'react';
import {useEffect } from 'react';
import { Send, Users, Calendar, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Audience {
  id: string;
  name: string;
  count: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  audiences: Audience[];
  onCampaignCreated: () => void;
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  audiences,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const [campaignName, setCampaignName] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Fetch customers when "single" audience is selected
  useEffect(() => {
    if (isOpen && selectedAudience === 'single') {
      setCustomersLoading(true);
      fetch('/api/customer')
        .then((res) => res.json())
        .then((data: Customer[]) => {
          setCustomers(Array.isArray(data) ? data : []);
        })
        .catch(() => setCustomers([]))
        .finally(() => setCustomersLoading(false));
    } else {
      setSelectedCustomerId('');
    }
  }, [isOpen, selectedAudience]);

  const createCampaign = async (actionType: 'draft' | 'send' | 'schedule') => {
    if (!campaignName || !subject || !emailBody) {
      toast.error('Please fill in all fields');
      return;
    }

    if (selectedAudience === 'single' && !selectedCustomerId) {
      toast.error('Please select a customer to send the test email to');
      return;
    }

    if (actionType === 'schedule' && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time for scheduling');
      return;
    }

    const setLoading = actionType === 'draft' ? setIsSaving : setIsSending;
    setLoading(true);

    try {
      const payload: any = {
        campaignName,
        subject,
        emailBody,
        audienceId: selectedAudience === 'all' ? undefined : selectedAudience,
      };
      if (selectedAudience === 'single' && selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      }

      if (actionType === 'send') {
        payload.status = 'Sent';
        payload.sentAt = new Date().toISOString();
      } else if (actionType === 'schedule') {
        payload.status = 'Scheduled';
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

        if (scheduledDateTime <= new Date()) {
          toast.error('Scheduled time must be in the future');
          setLoading(false);
          return;
        }

        payload.scheduledFor = scheduledDateTime.toISOString();
      } else {
        payload.status = 'Draft';
      }

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${actionType} campaign`);
      }

      const successMessage =
        actionType === 'draft' ? 'Draft saved successfully!' :
          actionType === 'schedule' ? 'Campaign scheduled successfully!' :
            'Campaign is being sent! This may take a few minutes.';

      toast.success(successMessage);

      setCampaignName('');
      setSelectedAudience('all');
      setSelectedCustomerId('');
      setSubject('');
      setEmailBody('');
      setScheduledDate('');
      setScheduledTime('');
      setShowSchedule(false);
      onCampaignCreated();
    } catch (error) {
      console.error(`Error ${actionType} campaign:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${actionType} campaign`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => createCampaign('send');
  const handleSaveDraft = () => createCampaign('draft');
  const handleSchedule = () => {
    if (showSchedule) {
      createCampaign('schedule');
    } else {
      setShowSchedule(true);
    }
  };

  const handleCancelSchedule = () => {
    setShowSchedule(false);
    setScheduledDate('');
    setScheduledTime('');
  };

  if (!isOpen) return null;

  const isDisabled = isSending || isSaving;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 border-b border-border rounded-t-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2 bg-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>New Email Campaign</CardTitle>
                  <CardDescription>
                    Create and send an email to your customers
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isDisabled}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </div>

        {/* Form Body */}
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Spring Sale 2025"
              disabled={isDisabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="audience" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Audience
            </Label>
            <Select
              value={selectedAudience}
              onValueChange={setSelectedAudience}
              disabled={isDisabled}
            >
              <SelectTrigger id="audience" className="w-full">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {audiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    {audience.name} ({audience.count.toLocaleString()} {audience.id === 'single' ? 'recipient' : 'customers'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isDisabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email-body">Email Body</Label>
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{{firstName}}'}</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{{lastName}}'}</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{{email}}'}</code> for personalization
            </p>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your email message here..."
              rows={10}
              disabled={isDisabled}
              className="resize-none"
            />
          </div>

          {/* Schedule Section */}
          {showSchedule && (
            <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Schedule for Later
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSchedule}
                  className="h-7 text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
              {scheduledDate && scheduledTime && (() => {
                try {
                  const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
                  const now = new Date();
                  const isToday = scheduledDate === now.toISOString().split('T')[0];
                  const isPast = scheduledDateTime <= now;
                  const minutesUntil = Math.round((scheduledDateTime.getTime() - now.getTime()) / 1000 / 60);

                  if (isPast) {
                    return (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Selected time is in the past. Please choose a future time.
                      </p>
                    );
                  }
                  if (isToday) {
                    return (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Scheduled for today in {minutesUntil} minute(s) ({scheduledTime})
                      </p>
                    );
                  }
                  const daysUntil = Math.floor(minutesUntil / 1440);
                  const hoursUntil = Math.floor((minutesUntil % 1440) / 60);
                  return (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Scheduled for {daysUntil > 0 ? `${daysUntil} day(s) and ` : ''}{hoursUntil} hour(s) from now
                      {' '}({scheduledDateTime.toLocaleDateString()} at {scheduledTime})
                    </p>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 rounded-b-xl flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isDisabled}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <div className="flex items-center gap-2">
            {!showSchedule && (
              <Button
                onClick={handleSend}
                disabled={isDisabled}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Now'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSchedule}
              disabled={isDisabled}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {showSchedule ? (isSending ? 'Scheduling...' : 'Confirm Schedule') : 'Schedule'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
