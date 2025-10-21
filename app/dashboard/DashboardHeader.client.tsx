"use client";

import * as React from "react";
import { RefreshCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  connected: boolean;
  lastSyncIso: string | null;
};

function formatAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Make props optional and provide defaults
export default function DashboardHeaderClient(
  { connected = false, lastSyncIso = null }: Partial<Props> = {}
) {
  const [syncing, startSync] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ accessToken: "", locationId: "" });
  const [status, setStatus] = React.useState({ connected, lastSyncIso });

  // (Optional) hydrate from API on mount
  React.useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/square/sync", { cache: "no-store" }).then((r) => r.json());
        setStatus({ connected: !!s.connected, lastSyncIso: s.lastSyncIso ?? null });
      } catch {}
    })();
  }, []);

  async function doSyncAll() {
    startSync(async () => {
      const res = await fetch("/api/square/sync", { method: "POST" });
      if (res.ok) {
        const s = await fetch("/api/square/sync", { cache: "no-store" }).then((r) => r.json());
        setStatus({ connected: !!s.connected, lastSyncIso: s.lastSyncIso ?? null });
      } else {
        alert("Sync failed. Please try again.");
      }
    });
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/integrations/square/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert("Could not save settings.");
      return;
    }
    const s = await fetch("/api/square/sync", { cache: "no-store" }).then((r) => r.json());
    setStatus({ connected: !!s.connected, lastSyncIso: s.lastSyncIso ?? null });
    setOpen(false);
  }

  return (
    <section
      className="relative w-full overflow-visible rounded-2xl border
                 bg-white dark:bg-neutral-900
                 border-gray-200 dark:border-neutral-800
                 px-4 sm:px-6 py-4 sm:py-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left — Title + status */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span>Square Integration Status:</span>
              <Badge variant={status.connected ? "default" : "outline"}>
                {status.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            {/* Divider */}
            <div className="hidden h-4 w-px bg-gray-200 dark:bg-neutral-700 sm:block" />

            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400">Last sync:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatAgo(status.lastSyncIso)}
              </span>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <Button
            onClick={doSyncAll}
            disabled={syncing}
            aria-disabled={syncing}
            className="shrink-0"
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync All"}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>

            <DialogContent className="dark:bg-neutral-900 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Square Integration Settings</DialogTitle>
              </DialogHeader>

              <form className="space-y-4" onSubmit={saveConfig}>
                <div className="grid gap-1">
                  <Label htmlFor="accessToken" className="dark:text-gray-200">
                    Access Token
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="sq0at-..."
                    className="dark:bg-neutral-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:border-neutral-700"
                    value={form.accessToken}
                    onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="locationId" className="dark:text-gray-200">
                    Location ID
                  </Label>
                  <Input
                    id="locationId"
                    placeholder="L123ABCXYZ"
                    className="dark:bg-neutral-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:border-neutral-700"
                    value={form.locationId}
                    onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="shrink-0">
                    Cancel
                  </Button>
                  <Button type="submit" className="shrink-0">
                    Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
