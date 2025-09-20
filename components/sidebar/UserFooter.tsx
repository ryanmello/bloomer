import { User } from "@prisma/client";

interface UserFooterProps {
  currentUser: User;
}

export default function UserFooter({ currentUser }: UserFooterProps) {
  return (
    <div className="w-full border-[1px] p-2 rounded-md">
      <p>{currentUser.name}</p>
    </div>
  );
}
