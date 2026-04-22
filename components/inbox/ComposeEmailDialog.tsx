"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, ImagePlus, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

type ComposeEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gmailConnected: boolean;
  onSent?: () => void;
  /** Applied when the dialog opens (e.g. reply pre-fill). */
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
};

export default function ComposeEmailDialog({
  open,
  onOpenChange,
  gmailConnected,
  onSent,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  const resetForm = useCallback(() => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setBodyHtml("");
    setFiles([]);
  }, []);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTo(initialTo);
      setCc("");
      setBcc("");
      setSubject(initialSubject);
      setBody(initialBody);
      setBodyHtml("");
      setFiles([]);
    } else if (!open && wasOpenRef.current) {
      resetForm();
    }
    wasOpenRef.current = open;
  }, [open, initialTo, initialSubject, initialBody, resetForm]);

  const appendFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((prev) => {
      const next = [...prev];
      for (let i = 0; i < list.length; i++) {
        next.push(list[i]);
      }
      return next;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!gmailConnected) {
      toast.error("Connect Gmail before sending.");
      return;
    }
    if (!to.trim() || !subject.trim()) {
      toast.error("To and Subject are required.");
      return;
    }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("to", to.trim());
      if (cc.trim()) fd.append("cc", cc.trim());
      if (bcc.trim()) fd.append("bcc", bcc.trim());
      fd.append("subject", subject.trim());
      fd.append("body", body);
      if (bodyHtml.trim()) fd.append("bodyHtml", bodyHtml.trim());
      files.forEach((f) => fd.append("attachments", f));

      const res = await axios.post("/api/inbox/send", fd);
      toast.success("Message sent.");
      onOpenChange(false);
      onSent?.();
      resetForm();
      if (res.data?.messageId) {
        console.info("[compose] Gmail message id:", res.data.messageId);
      }
    } catch (err: unknown) {
      const ax = axios.isAxiosError(err) ? err : null;
      const msg =
        (ax?.response?.data as { error?: string })?.error ||
        ax?.message ||
        "Failed to send";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose email</DialogTitle>
          <DialogDescription>
            Sends from your connected Gmail. Recipients can open attached files and images in their mail client.
            {!gmailConnected && " Connect Gmail first to enable sending."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              placeholder="name@example.com, other@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-cc">Cc (optional)</Label>
            <Input
              id="compose-cc"
              placeholder="Optional"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-bcc">Bcc (optional)</Label>
            <Input
              id="compose-bcc"
              placeholder="Optional"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              rows={6}
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-html">HTML version (optional)</Label>
            <Textarea
              id="compose-html"
              rows={4}
              placeholder="Optional HTML for rich clients (you can use tags like paragraph and links)."
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              disabled={sending}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                appendFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                appendFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-1.5" />
              Attach files
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sending}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4 mr-1.5" />
              Add pictures
            </Button>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2 rounded-md border border-border p-2 text-sm">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}-${f.size}`}
                  className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1.5"
                >
                  <span className="truncate flex-1" title={f.name}>
                    {f.name}
                    <span className="text-muted-foreground ml-1">
                      ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(i)}
                    disabled={sending}
                    aria-label="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSend} disabled={sending || !gmailConnected}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
