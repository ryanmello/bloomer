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

export default function DashboardHeaderClient({ connected, lastSyncIso }: Props) {
  const [syncing, startSync] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ accessToken: "", locationId: "" });
  const [status, setStatus] = React.useState({ connected, lastSyncIso });

  async function doSyncAll() {
    startSync(async () => {
      const res = await fetch("/api/square/sync", { method: "POST" });
      if (res.ok) {
        const s = await fetch("/api/square/sync").then((r) => r.json());
        setStatus(s);
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
    const s = await fetch("/api/square/sync").then((r) => r.json());
    setStatus(s);
    setOpen(false);
  }

  return (
    <section className="w-full rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — Title + status */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Square Integration Status:</span>
              <Badge variant={status.connected ? "default" : "outline"}>
                {status.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="hidden h-4 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Last sync:</span>
              <span className="font-medium text-gray-800">
                {formatAgo(status.lastSyncIso)}
              </span>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={doSyncAll} disabled={syncing} aria-disabled={syncing}>
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync All"}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Square Integration Settings</DialogTitle>
              </DialogHeader>

              <form className="space-y-4" onSubmit={saveConfig}>
                <div className="grid gap-1">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="sq0at-..."
                    value={form.accessToken}
                    onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input
                    id="locationId"
                    placeholder="L123ABCXYZ"
                    value={form.locationId}
                    onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
