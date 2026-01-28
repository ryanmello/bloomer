"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Inbox as InboxIcon, Send, Trash2, Archive, Star, Search, Filter, MailOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import clsx from "clsx";

type EmailPlatform = "gmail" | null;

type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  important?: boolean;
};

type IntegrationStatus = {
  gmail: {
    email: string;
    connected: boolean;
  } | null;
};

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [platform, setPlatform] = useState<EmailPlatform>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({ gmail: null });

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
    
    // Check for OAuth callback success
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected) {
      toast.success('Gmail connected successfully!');
      checkConnectionStatus();
      // Clean up URL
      router.replace('/inbox');
    }
    
    if (error) {
      toast.error(`Connection failed: ${error}`);
      router.replace('/inbox');
    }
  }, [searchParams, router]);

  // Fetch emails when platform is connected
  useEffect(() => {
    if (platform && integrationStatus[platform]?.connected) {
      fetchEmails(platform);
    }
  }, [platform, integrationStatus]);

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get('/api/inbox/status');
      const status = response.data;
      setIntegrationStatus(status);
      
      // Auto-select connected platform
      if (status.gmail?.connected) {
        setPlatform('gmail');
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/inbox/oauth/gmail`);
      const { authUrl } = response.data;
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initiate OAuth');
      setLoading(false);
    }
  };

  const fetchEmails = async (platformToFetch: "gmail") => {
    try {
      setLoadingEmails(true);
      const response = await axios.get(`/api/inbox/emails?platform=${platformToFetch}`);
      setEmails(response.data.emails || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch emails');
      console.error('Fetch emails error:', error);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleDisconnect = async () => {
    if (!platform) return;
    
    try {
      await axios.post('/api/inbox/disconnect', { platform: 'gmail' });
      toast.success('Gmail disconnected');
      setPlatform(null);
      setEmails([]);
      setSelectedEmail(null);
      await checkConnectionStatus();
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    // In a real implementation, you would mark as read via API
  };

  const filteredEmails = emails.filter(email =>
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = emails.filter(e => !e.read).length;
  const connectedPlatform = integrationStatus.gmail?.connected ? 'gmail' : null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-2">
            Manage your email communications
          </p>
        </div>
        {connectedPlatform && (
          <Badge variant="default">
            <span className="text-sm">
              Gmail Connected
              {integrationStatus.gmail?.email && ` - ${integrationStatus.gmail.email}`}
            </span>
          </Badge>
        )}
      </div>

      {/* Platform Selection Card */}
      {!connectedPlatform && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Email</CardTitle>
            <CardDescription>
              Choose your email platform to sync your inbox. You'll be redirected to sign in securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <button
                onClick={handlePlatformSelect}
                disabled={loading}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-md"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Gmail</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Gmail account securely
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inbox Interface */}
      {connectedPlatform && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchEmails(connectedPlatform)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Inbox</CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="default">{unreadCount} unread</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingEmails ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading emails...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEmails.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No emails found</p>
                      </div>
                    ) : (
                      filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => handleEmailClick(email)}
                          className={clsx(
                            "p-4 cursor-pointer hover:bg-accent transition-colors",
                            !email.read && "bg-muted/50",
                            selectedEmail?.id === email.id && "bg-accent border-l-4 border-l-primary"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {email.read ? (
                                <MailOpen className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Mail className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={clsx(
                                  "font-medium truncate",
                                  !email.read && "font-semibold"
                                )}>
                                  {email.from}
                                </p>
                                {email.important && (
                                  <Badge variant="danger" className="text-xs">Important</Badge>
                                )}
                              </div>
                              <p className={clsx(
                                "text-sm truncate mb-1",
                                !email.read && "font-semibold"
                              )}>
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {email.preview}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {email.date}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // In real implementation, toggle star via API
                                }}
                                className={clsx(
                                  "p-1 rounded hover:bg-accent transition-colors",
                                  email.starred && "text-yellow-500"
                                )}
                              >
                                <Star
                                  className={clsx(
                                    "h-4 w-4",
                                    email.starred ? "fill-current" : ""
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Preview/Details */}
          <div className="space-y-4">
            {selectedEmail ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {selectedEmail.subject}
                      </CardTitle>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">From:</span>{" "}
                          <span className="font-medium">{selectedEmail.from}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEmail.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Star
                          className={clsx(
                            "h-4 w-4",
                            selectedEmail.starred && "fill-current text-yellow-500"
                          )}
                        />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedEmail.preview}
                    </p>
                    <p className="text-muted-foreground mt-4 text-sm">
                      Full email content would be displayed here. In a production implementation, 
                      this would fetch the complete email body from the API.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an email to view</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Compose Email
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => fetchEmails(connectedPlatform)}
                >
                  <InboxIcon className="h-4 w-4 mr-2" />
                  Inbox ({unreadCount})
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived
                </Button>
              </CardContent>
            </Card>

            {/* Platform Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Platform</CardTitle>
                <CardDescription>
                  Manage your Gmail connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Connected Account</p>
                  <p className="text-sm text-muted-foreground">
                    {integrationStatus.gmail?.email || 'Not connected'}
                  </p>
                </div>
                {connectedPlatform ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDisconnect}
                  >
                    Disconnect Gmail
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePlatformSelect}
                  >
                    Connect Gmail
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Inbox() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}
