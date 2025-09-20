import { User } from '@prisma/client'

interface UserFooterProps {
  currentUser: User;
}

export default function UserFooter({currentUser}: UserFooterProps) {
  return (
    <div>UserFooter</div>
  )
}
