import { getCurrentUser } from "@/actions/getCurrentUser";
import SidebarContent from "./SidebarContent";
import { User } from "@prisma/client";

export default async function Sidebar() {
  const currentUser = (await getCurrentUser()) as User;

  return <SidebarContent currentUser={currentUser} />;
}
