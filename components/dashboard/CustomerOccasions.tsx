import { Calendar, Heart, Cake, Mail, Phone } from 'lucide-react';

type CustomerOccasion = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  occasionType: 'birthday' | 'anniversary';
  occasionDate: string;
  daysUntil: number;
  notes?: string;
};

export default function CustomerOccasions() {
  const occasions: CustomerOccasion[] = [
    {
      id: '1',
      customerName: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '(555) 123-4567',
      occasionType: 'anniversary',
      occasionDate: 'Feb 14, 2025',
      daysUntil: 3,
      notes: 'Prefers red roses',
    },
    {
      id: '2',
      customerName: 'Emma Johnson',
      email: 'emma.j@email.com',
      phone: '(555) 234-5678',
      occasionType: 'birthday',
      occasionDate: 'Feb 18, 2025',
      daysUntil: 7,
      notes: 'Likes sunflowers and daisies',
    },
    {
      id: '3',
      customerName: 'David Chen',
      email: 'david.chen@email.com',
      phone: '(555) 345-6789',
      occasionType: 'anniversary',
      occasionDate: 'Feb 22, 2025',
      daysUntil: 11,
    },
    {
      id: '4',
      customerName: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      phone: '(555) 456-7890',
      occasionType: 'birthday',
      occasionDate: 'Feb 28, 2025',
      daysUntil: 17,
      notes: 'Allergic to lilies',
    },
    {
      id: '5',
      customerName: 'Michael Brown',
      email: 'mbrown@email.com',
      phone: '(555) 567-8901',
      occasionType: 'anniversary',
      occasionDate: 'Mar 8, 2025',
      daysUntil: 25,
      notes: 'Wedding anniversary - prefers tulips',
    },
    {
      id: '6',
      customerName: 'Jennifer Davis',
      email: 'jen.davis@email.com',
      phone: '(555) 678-9012',
      occasionType: 'birthday',
      occasionDate: 'Mar 15, 2025',
      daysUntil: 32,
    },
    {
      id: '7',
      customerName: 'Robert Taylor',
      email: 'rtaylor@email.com',
      phone: '(555) 789-0123',
      occasionType: 'anniversary',
      occasionDate: 'Mar 22, 2025',
      daysUntil: 39,
      notes: 'Orders every year - orchids preferred',
    },
    {
      id: '8',
      customerName: 'Amanda Wilson',
      email: 'amanda.w@email.com',
      phone: '(555) 890-1234',
      occasionType: 'birthday',
      occasionDate: 'Apr 5, 2025',
      daysUntil: 53,
    },
    {
        id: '9',
        customerName: 'Sarah Mitchell',
        email: 'sarah.mitchell@email.com',
        phone: '(555) 123-4567',
        occasionType: 'anniversary',
        occasionDate: 'Feb 14, 2025',
        daysUntil: 3,
        notes: 'Prefers red roses',
      },
      {
        id: '10',
        customerName: 'Emma Johnson',
        email: 'emma.j@email.com',
        phone: '(555) 234-5678',
        occasionType: 'birthday',
        occasionDate: 'Feb 18, 2025',
        daysUntil: 7,
        notes: 'Likes sunflowers and daisies',
      },
      {
        id: '11',
        customerName: 'David Chen',
        email: 'david.chen@email.com',
        phone: '(555) 345-6789',
        occasionType: 'anniversary',
        occasionDate: 'Feb 22, 2025',
        daysUntil: 11,
      },
      {
        id: '12',
        customerName: 'Lisa Anderson',
        email: 'lisa.a@email.com',
        phone: '(555) 456-7890',
        occasionType: 'birthday',
        occasionDate: 'Feb 28, 2025',
        daysUntil: 17,
        notes: 'Allergic to lilies',
      },
      {
        id: '13',
        customerName: 'Michael Brown',
        email: 'mbrown@email.com',
        phone: '(555) 567-8901',
        occasionType: 'anniversary',
        occasionDate: 'Mar 8, 2025',
        daysUntil: 25,
        notes: 'Wedding anniversary - prefers tulips',
      },
      {
        id: '14',
        customerName: 'Jennifer Davis',
        email: 'jen.davis@email.com',
        phone: '(555) 678-9012',
        occasionType: 'birthday',
        occasionDate: 'Mar 15, 2025',
        daysUntil: 32,
      },
      {
        id: '15',
        customerName: 'Robert Taylor',
        email: 'rtaylor@email.com',
        phone: '(555) 789-0123',
        occasionType: 'anniversary',
        occasionDate: 'Mar 22, 2025',
        daysUntil: 39,
        notes: 'Orders every year - orchids preferred',
      },
      {
        id: '16',
        customerName: 'Amanda Wilson',
        email: 'amanda.w@email.com',
        phone: '(555) 890-1234',
        occasionType: 'birthday',
        occasionDate: 'Apr 5, 2025',
        daysUntil: 53,
      },
  ];

  const getOccasionIcon = (type: CustomerOccasion['occasionType']) => {
    switch (type) {
      case 'anniversary':
        return Heart;
      case 'birthday':
        return Cake;
      default:
        return Calendar;
    }
  };

  const getOccasionColor = (type: CustomerOccasion['occasionType']) => {
    switch (type) {
      case 'anniversary':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
      case 'birthday':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
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
    <div className='w-full rounded-2xl border shadow-sm p-4 sm:p-6 bg-card border-border min-w-0'>
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg font-semibold text-foreground">Customer Occasions</h3>
        <p className="text-sm text-muted-foreground mt-1">Upcoming customer birthdays and anniversaries</p>
      </div>
      
      <div className="overflow-auto max-h-[500px] scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Customer</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Contact</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Occasion</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Date</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Time Until</th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Notes</th>
            </tr>
          </thead>
          <tbody>
            {occasions.map((occasion) => {
              const IconComponent = getOccasionIcon(occasion.occasionType);
              return (
                <tr 
                  key={occasion.id} 
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <p className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{occasion.customerName}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{occasion.email}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">{occasion.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${getOccasionColor(occasion.occasionType)}`}>
                      <IconComponent className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">{occasion.occasionType === 'anniversary' ? 'Anniversary' : 'Birthday'}</span>
                      <span className="sm:hidden">{occasion.occasionType === 'anniversary' ? 'Anniv.' : 'B-day'}</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <p className="text-xs sm:text-sm text-foreground whitespace-nowrap">{occasion.occasionDate}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {getUrgencyBadge(occasion.daysUntil)}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-[150px] sm:max-w-xs truncate">
                      {occasion.notes || '-'}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
