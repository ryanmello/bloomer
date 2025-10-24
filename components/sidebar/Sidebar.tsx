"use client";

import { useUser } from "@/context/AuthContext";
import {
  BookText,
  Funnel,
  LayoutDashboard,
  Mail,
  MessageSquare,
  NotebookTabs,
  Send,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
  UsersRound,
  Zap,
} from "lucide-react";
import { Command, CommandGroup, CommandList } from "../ui/command";
import Image from "next/image";
import Flower from "@/public/flower.png";
import SidebarItem from "./SidebarItem";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar() {
  const { user, isLoading } = useUser();

  const menuList = [
    {
      group: "Overview",
      items: [
        {
          link: "/dashboard",
          icon: <LayoutDashboard />,
          text: "Dashboard",
          hidden: false,
        },
        {
          link: "/inbox",
          icon: <MessageSquare />,
          text: "Inbox",
          hidden: false,
        },
        {
          link: "/customers",
          icon: <UsersRound />,
          text: "Customers",
          hidden: false,
        },
      ],
    },
    {
      group: "Marketing",
      items: [
        {
          link: "/automations",
          icon: <Zap />,
          text: "Automations",
          hidden: false,
        },
        {
          link: "/audiences",
          icon: <Funnel />,
          text: "Audiences",
          hidden: false,
        },
        {
          link: "/contact",
          icon: <NotebookTabs />,
          text: "Contact Lists",
          hidden: false,
        },
        {
          link: "/forms",
          icon: <BookText />,
          text: "Forms",
          hidden: false,
        },
        {
          link: "/broadcasts",
          icon: <Send />,
          text: "Text Broadcast",
          hidden: false,
        },
        {
          link: "/broadcasts",
          icon: <Mail />,
          text: "Email Broadcast",
          hidden: false,
        },
      ],
    },
    {
      group: "Sales",
      items: [
        {
          link: "/orders",
          icon: <ShoppingBag />,
          text: "Online Orders",
          hidden: false,
        },
        {
          link: "/storefront",
          icon: <Store />,
          text: "Storefront",
          hidden: false,
        },
        {
          link: "/coupons",
          icon: <Ticket />,
          text: "Coupons",
          hidden: false,
        },
      ],
    },
    {
      group: "Configure",
      items: [
        {
          link: "/settings",
          icon: <Settings />,
          text: "Settings",
          hidden: false,
        },
      ],
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 flex flex-col border-r h-screen p-4 transition-width duration-300 ease-in-out w-[260px] flex-shrink-0 space-y-4 z-50"
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 cursor-pointer">
          <Image src={Flower} alt="Flower" width="24" height="24" />
          <h1 className="font-bold">Bloomer</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <Command className="h-full">
          <CommandList className="h-full max-h-none">
            {menuList.map((menu: any, key: number) => (
              <CommandGroup key={key} heading={menu.group}>
                {menu.items
                  .filter((option: any) => !option.hidden)
                  .map((option: any, optionKey: number) => (
                    <SidebarItem
                      key={optionKey}
                      option={option}
                      className="mb-0.5 last:mb-0"
                      disabled={isLoading}
                    />
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
      <SidebarFooter isLoading={isLoading} currentUser={user} />
    </aside>
  );
}
