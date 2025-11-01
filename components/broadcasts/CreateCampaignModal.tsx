'use client';
import { Send, Users } from 'lucide-react';

interface Audience {
  id: string;
  name: string;
  count: number;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  setCampaignName: (value: string) => void;
  selectedAudience: string;
  setSelectedAudience: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  emailBody: string;
  setEmailBody: (value: string) => void;
  onSend: () => void;
  audiences: Audience[];
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  campaignName,
  setCampaignName,
  selectedAudience,
  setSelectedAudience,
  subject,
  setSubject,
  emailBody,
  setEmailBody,
  onSend,
  audiences,
}: CreateCampaignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Modal Header */}
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
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Campaign name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Campaign name"
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
            />
          </div>

          {/* Select Audience */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Select audience
            </label>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition appearance-none cursor-pointer"
            >
              <option value="">Campaign name</option>
              {audiences.map((audience) => (
                <option key={audience.id} value={audience.id}>
                  {audience.name} ({audience.count.toLocaleString()} customers)
                </option>
              ))}
            </select>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Subject line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email body"
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email body
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your email message here..."
              rows={12}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
          >
            Save Draft
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onSend}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
            <button className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors">
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}