'use client';
import { useState } from 'react';
import { Send, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Audience {
  id: string;
  name: string;
  count: number;
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
  const [selectedAudience, setSelectedAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const createCampaign = async (actionType: 'draft' | 'send' | 'schedule') => {
    if (!campaignName || !selectedAudience || !subject || !emailBody) {
      toast.error('Please fill in all fields');
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
        audienceType: selectedAudience,
      };

      if (actionType === 'send') {
        payload.status = 'Sent';
        payload.sentAt = new Date().toISOString();
      } else if (actionType === 'schedule') {
        payload.status = 'Scheduled';
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
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
      
      // Reset form
      setCampaignName('');
      setSelectedAudience('');
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">New Email Campaign</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create and send an email to your customers
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSending || isSaving}
              className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Campaign name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Spring Sale 2025"
              disabled={isSending || isSaving}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Select audience
            </label>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              disabled={isSending || isSaving}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Select an audience</option>
              {audiences.map((audience) => (
                <option key={audience.id} value={audience.id}>
                  {audience.name} ({audience.count.toLocaleString()} customers)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Subject line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isSending || isSaving}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email body
            </label>
            <div className="mb-2 text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded">{'{{firstName}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{lastName}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{email}}'}</code> for personalization
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your email message here..."
              rows={12}
              disabled={isSending || isSaving}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition resize-none disabled:opacity-50"
            />
          </div>

          {showSchedule && (
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-foreground">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Schedule for later
                </label>
                <button
                  onClick={handleCancelSchedule}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-between">
          <button
            onClick={handleSaveDraft}
            disabled={isSending || isSaving}
            className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <div className="flex items-center gap-3">
            {!showSchedule && (
              <button
                onClick={handleSend}
                disabled={isSending || isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Now'}
              </button>
            )}
            <button 
              onClick={handleSchedule}
              disabled={isSending || isSaving}
              className="flex items-center gap-2 px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              {showSchedule ? (isSending ? 'Scheduling...' : 'Confirm Schedule') : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}