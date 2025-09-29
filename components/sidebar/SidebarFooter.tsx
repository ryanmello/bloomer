import { User } from "@prisma/client";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface UserFooterProps {
  isLoading: boolean;
  currentUser: User | null;
}

export default function UserFooter({
  isLoading,
  currentUser,
}: UserFooterProps) {
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

  const initials = currentUser
    ? getInitials(currentUser.name, currentUser.email)
    : "U";
  const displayName = currentUser
    ? currentUser.name || currentUser.email || "User"
    : "User";

  return (
    <div className="w-full space-y-2">
      {/* User Info Card */}
      {isLoading ? (
        <div className="border p-2 rounded-lg bg-card/50">
          <div className="flex items-center gap-3 h-9">
            {/* Avatar Skeleton */}
            <Skeleton className="w-8 h-8 rounded-full" />

            {/* User Info Skeleton */}
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ) : currentUser ? (
        <div className="border p-2 rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
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
                <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {initials}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              {currentUser.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border p-2 rounded-lg bg-card/50">
          <div className="flex items-center gap-3">
            {/* Default Avatar */}
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>

            {/* No User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Not signed in
              </p>
              <p className="text-xs text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
