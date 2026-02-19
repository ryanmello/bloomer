"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import {useRef, useState} from "react";
import {Button} from "@/components/ui/button";

/**
 * https://fullcalendar.io/docs/react
 * https://fullcalendar.io/docs
 */
export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
  });

  const handleDateClick = (info: any) => {
    setNewEvent({
      title: "",
      start: info.dateStr,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!newEvent.title) return;

    setEvents((prev) => [...prev, newEvent]);
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar</h1>

        <Button>+ Add Event</Button>
      </div>

      {/* Calendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        editable
        headerToolbar={false}
        dateClick={handleDateClick}
        events={events}
      />
    </div>
  );
}
