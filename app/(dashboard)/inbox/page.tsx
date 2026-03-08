"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Inbox as InboxIcon, Send, Trash2, Archive, Star, Search, Filter, MailOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import clsx from "clsx";

type EmailPlatform = "gmail" | null;

type InboxView = "inbox" | "starred" | "archived";

type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  archived?: boolean;
  canDelete?: boolean;
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
  const [view, setView] = useState<InboxView>("inbox");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const fetchEmails = useCallback(
    async (
      platformToFetch: "gmail",
      pageToken?: string,
      loadMore = false
    ) => {
      try {
        if (loadMore) {
          setIsLoadingMore(true);
        } else {
          setLoadingEmails(true);
        }
        const params = new URLSearchParams({
          platform: platformToFetch,
          view,
          ...(pageToken && { pageToken }),
        });
        const response = await axios.get(`/api/inbox/emails?${params.toString()}`);
        const newEmails = response.data.emails || [];
        const token = response.data.nextPageToken ?? null;
        setNextPageToken(token);
        setEmails(loadMore ? (prev) => [...prev, ...newEmails] : newEmails);
      } catch (error: unknown) {
        const err = axios.isAxiosError(error) ? error : null;
        toast.error(err?.response?.data?.error || "Failed to fetch emails");
        console.error("Fetch emails error:", error);
      } finally {
        setLoadingEmails(false);
        setIsLoadingMore(false);
      }
    },
    [view]
  );

  // Fetch emails when platform is connected or view changes
  useEffect(() => {
    if (platform && integrationStatus[platform]?.connected) {
      setNextPageToken(null);
      fetchEmails(platform, undefined, false);
    }
  }, [platform, integrationStatus, view, fetchEmails]);

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get('/api/inbox/status');
      const status = response.data;
      setIntegrationStatus(status);

      // Auto-select connected platform
      if (status.gmail?.connected) {
        setPlatform('gmail');
      }
    } catch (error: unknown) {
      const err = axios.isAxiosError(error) ? error : null;
      const msg = err?.response?.data?.error || err?.message;
      if (err?.response?.status === 503 && typeof msg === 'string' && msg.includes('prisma generate')) {
        toast.error('Database setup needed: stop the dev server, run "npx prisma generate", then restart.');
      } else {
        console.error('Failed to check connection status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/inbox/oauth/gmail");
      const { authUrl } = response.data;
      if (!authUrl) {
        toast.error("No redirect URL received. Check Gmail OAuth configuration.");
        return;
      }
      window.location.href = authUrl;
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to start Gmail connection. Check that GOOGLE_CLIENT_ID is set.";
      toast.error(msg);
      console.error("[Inbox] Gmail OAuth start error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (email: Email) => {
    if (actionLoading) return;
    setActionLoading(email.id);
    try {
      await axios.post(`/api/inbox/emails/${email.id}/favorite`, {
        favorite: !email.starred,
      });
      const updated = { ...email, starred: !email.starred };
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? updated : e))
      );
      if (selectedEmail?.id === email.id) setSelectedEmail(updated);
      toast.success(email.starred ? "Removed from favorites" : "Added to favorites");
    } catch (error: unknown) {
      const err = axios.isAxiosError(error) ? error : null;
      toast.error(err?.response?.data?.error || "Failed to update favorite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (email: Email) => {
    if (actionLoading) return;
    setActionLoading(email.id);
    try {
      await axios.post(`/api/inbox/emails/${email.id}/archive`, {
        archive: !email.archived,
      });
      const updated = { ...email, archived: !email.archived };
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      if (selectedEmail?.id === email.id) setSelectedEmail(null);
      toast.success(email.archived ? "Restored to inbox" : "Archived");
    } catch (error: unknown) {
      const err = axios.isAxiosError(error) ? error : null;
      toast.error(err?.response?.data?.error || "Failed to archive");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (email: Email) => {
    setEmailToDelete(email);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!emailToDelete || actionLoading) return;
    setActionLoading(emailToDelete.id);
    try {
      await axios.post(`/api/inbox/emails/${emailToDelete.id}/delete`);
      setEmails((prev) => prev.filter((e) => e.id !== emailToDelete.id));
      if (selectedEmail?.id === emailToDelete.id) setSelectedEmail(null);
      toast.success("Email moved to trash");
    } catch (error: unknown) {
      const err = axios.isAxiosError(error) ? error : null;
      toast.error(err?.response?.data?.error || "Failed to delete");
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setEmailToDelete(null);
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
              Choose your email platform to sync your inbox. You&apos;ll be redirected to sign in securely.
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmails(connectedPlatform, undefined, false)}
                  >
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
                  <CardTitle className="text-lg">
                    {view === "inbox" ? "Inbox" : view === "starred" ? "Starred" : "Archived"}
                  </CardTitle>
                  {view === "inbox" && unreadCount > 0 && (
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
                                  handleFavorite(email);
                                }}
                                disabled={actionLoading === email.id}
                                className={clsx(
                                  "p-1 rounded hover:bg-accent transition-colors disabled:opacity-50",
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(email);
                                }}
                                disabled={actionLoading === email.id}
                                className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                              {email.canDelete !== false && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(email);
                                  }}
                                  disabled={actionLoading === email.id}
                                  className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {nextPageToken && !loadingEmails && (
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        fetchEmails(connectedPlatform, nextPageToken, true)
                      }
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Load more
                    </Button>
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
                        onClick={() => handleFavorite(selectedEmail)}
                        disabled={actionLoading === selectedEmail.id}
                      >
                        <Star
                          className={clsx(
                            "h-4 w-4",
                            selectedEmail.starred && "fill-current text-yellow-500"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(selectedEmail)}
                        disabled={actionLoading === selectedEmail.id}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      {selectedEmail.canDelete !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(selectedEmail)}
                          disabled={actionLoading === selectedEmail.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
                  variant={view === "inbox" ? "default" : "outline"}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setView("inbox")}
                >
                  <InboxIcon className="h-4 w-4 mr-2" />
                  Inbox ({unreadCount})
                </Button>
                <Button
                  variant={view === "starred" ? "default" : "outline"}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setView("starred")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>
                <Button
                  variant={view === "archived" ? "default" : "outline"}
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setView("archived")}
                >
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the email to trash. You can restore it from trash
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
