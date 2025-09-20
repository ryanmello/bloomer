"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ContactRound, Home, Settings, Users } from "lucide-react";
import { Command, CommandGroup, CommandList } from "../ui/command";
import Flower from "@/public/flower.png";
import SidebarItem from "./SidebarItem";
import UserFooter from "./UserFooter";
import { User } from "@prisma/client";

const SidebarContent = ({ currentUser }: { currentUser: User }) => {
  if (!currentUser) {
    return <p>uh oh</p>;
  }

  const menuList = [
    {
      group: "General",
      items: [
        {
          link: "/",
          icon: <Home />,
          text: "Home",
          hidden: false,
        },
        {
          link: "/community",
          icon: <Users />,
          text: "Community",
          hidden: false,
        },
        {
          link: `/${currentUser?.email}`,
          icon: <ContactRound />,
          text: "Profile",
          hidden: currentUser == null,
        },
        {
          link: "/settings",
          icon: <Settings />,
          text: "Settings",
          hidden: currentUser == null,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 border-r min-h-screen p-4 transition-width duration-300 ease-in-out fixed w-[260px] min-w-[260px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 cursor-pointer">
          <Image src={Flower} alt="Flower" width="24" height="24" />
          <h1 className="font-bold">Bloomer</h1>
        </div>
      </div>
      <div className="grow">
        <Command>
          <CommandList>
            {menuList.map((menu: any, key: number) => (
              <CommandGroup key={key}>
                {menu.items
                  .filter((option: any) => !option.hidden)
                  .map((option: any, optionKey: number) => (
                    <SidebarItem
                      key={optionKey}
                      option={option}
                      className="mb-0.5 last:mb-0"
                    />
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
      {currentUser && <UserFooter currentUser={currentUser} />}
    </div>
  );
};

export default SidebarContent;
