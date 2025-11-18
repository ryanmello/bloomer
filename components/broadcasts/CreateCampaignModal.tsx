'use client';
import { useState } from 'react';
import { Send, Users } from 'lucide-react';
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

  const createCampaign = async (status: 'Draft' | 'Sent') => {
    if (!campaignName || !selectedAudience || !subject || !emailBody) {
      toast.error('Please fill in all fields');
      return;
    }

    const setLoading = status === 'Draft' ? setIsSaving : setIsSending;
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName,
          subject,
          emailBody,
          audienceType: selectedAudience,
          status,
          ...(status === 'Sent' && { sentAt: new Date().toISOString() })
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status === 'Draft' ? 'save draft' : 'send campaign'}`);
      }

      toast.success(status === 'Draft' ? 'Draft saved successfully!' : 'Campaign sent successfully!');
      
      // Reset form
      setCampaignName('');
      setSelectedAudience('');
      setSubject('');
      setEmailBody('');
      onCampaignCreated();
    } catch (error) {
      console.error(`Error ${status === 'Draft' ? 'saving draft' : 'sending campaign'}:`, error);
      toast.error(status === 'Draft' ? 'Failed to save draft' : 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => createCampaign('Sent');
  const handleSaveDraft = () => createCampaign('Draft');

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
              disabled={isSending}
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
              disabled={isSending}
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
              disabled={isSending}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email body
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your email message here..."
              rows={12}
              disabled={isSending}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition resize-none disabled:opacity-50"
            />
          </div>
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
            <button
              onClick={handleSend}
              disabled={isSending || isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Send'}
            </button>
            <button 
              disabled={isSending || isSaving}
              className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}