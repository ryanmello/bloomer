import { Calendar, Heart, Cake, Gift, Users } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  date: string;
  type: 'anniversary' | 'birthday' | 'holiday' | 'wedding' | 'other';
  customer?: string;
  daysUntil: number;
};

export default function UpcomingEvents() {
  const events: Event[] = [
    {
      id: '1',
      title: "Valentine's Day",
      date: 'Feb 14, 2025',
      type: 'holiday',
      daysUntil: 3,
    },
    {
      id: '2',
      title: "Sarah & Michael's Anniversary",
      date: 'Feb 18, 2025',
      type: 'anniversary',
      customer: 'Sarah Mitchell',
      daysUntil: 7,
    },
    {
      id: '3',
      title: "Emma's Birthday",
      date: 'Feb 22, 2025',
      type: 'birthday',
      customer: 'Emma Johnson',
      daysUntil: 11,
    },
    {
      id: '4',
      title: "Johnson Wedding",
      date: 'Mar 5, 2025',
      type: 'wedding',
      customer: 'Rebecca Johnson',
      daysUntil: 22,
    },
    {
      id: '5',
      title: "Mother's Day",
      date: 'May 11, 2025',
      type: 'holiday',
      daysUntil: 89,
    },
    {
      id: '6',
      title: "David & Lisa's Anniversary",
      date: 'Mar 15, 2025',
      type: 'anniversary',
      customer: 'David Chen',
      daysUntil: 32,
    },
  ];

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'anniversary':
        return Heart;
      case 'birthday':
        return Cake;
      case 'holiday':
        return Gift;
      case 'wedding':
        return Users;
      default:
        return Calendar;
    }
  };

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'anniversary':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
      case 'birthday':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'holiday':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'wedding':
        return 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 7) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700">
          {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
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
    <div className='w-1/2 rounded-2xl border shadow-sm p-6 bg-card border-border h-[550px] flex flex-col'>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>
        <p className="text-sm text-muted-foreground mt-1">Important dates to remember</p>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">
        {events.map((event) => {
          const IconComponent = getEventIcon(event.type);
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={`rounded-lg p-2 ${getEventColor(event.type)}`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </p>
                    {event.customer && (
                      <p className="text-xs text-muted-foreground truncate">
                        {event.customer}
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
