"use client";

import {Calendar, Heart, Cake, Gift, Users} from "lucide-react";
import {useEffect, useState} from "react";

type Event = {
  id: string;
  title: string;
  date: string;
  notes?: string;
  daysUntil: number;
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/calendar");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch events");
      }

      const today = new Date();

      const mappedEvents: Event[] = data
        .map((item: any) => {
          const eventDate = new Date(item.start);
          const diffTime = eventDate.getTime() - today.getTime();
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            id: item.id,
            title: item.title,
            date: eventDate.toLocaleDateString("en-US", {
              // format like Mar 9, 2026
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            type: item.type || "other",
            notes: item.notes,
            daysUntil,
          };
        })
        .filter((event: Event) => event.daysUntil >= 0) // only upcoming
        .sort((a: Event, b: Event) => a.daysUntil - b.daysUntil); // nearest first

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Failed to load upcoming events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 7) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700">
          {daysUntil} {daysUntil === 1 ? "day" : "days"}
        </span>
      );
    } else if (daysUntil <= 14) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700">
          {daysUntil} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700">
          {daysUntil} days
        </span>
      );
    }
  };

  return (
    <div className="w-full xl:w-1/2 rounded-2xl border shadow-sm p-6 bg-card border-border h-[550px] flex flex-col min-w-0">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Upcoming Events
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Current calendar event
        </p>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">
        {events.map((event) => {
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </p>
                    {event.notes && (
                      <p className="text-xs text-muted-foreground truncate">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  {getUrgencyBadge(event.daysUntil)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
