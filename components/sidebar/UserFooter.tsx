import { User } from "@prisma/client";
import Image from "next/image";

interface UserFooterProps {
  currentUser: User;
}

export default function UserFooter({ currentUser }: UserFooterProps) {
  // Function to get user initials
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(currentUser.name, currentUser.email);
  const displayName = currentUser.name || currentUser.email || 'User';

  return (
    <div className="w-full border border-gray-200 p-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        <div className="relative">
          {currentUser.image ? (
            <Image
              src={currentUser.image}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </p>
          {currentUser.email && (
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
