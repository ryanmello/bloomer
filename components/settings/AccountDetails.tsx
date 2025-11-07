"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import AccountDetailsForm from "./AccountDetailsForm";
import { User } from "@prisma/client";

const AccountDetails = ({ user }: { user: User }) => {
  const [displayForm, setDisplayForm] = useState(!user.firstName);

  return (
    <div className="flex pt-4">
      {displayForm ? (
        <AccountDetailsForm user={user} setDisplayForm={setDisplayForm} />
      ) : (
        <>
          <div className="font-light space-y-1">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            {user.address1 && <p>{user.address1}</p>}
            {user.address2 && <p>{user.address2}</p>}
            {(user.city || user.state || user.postal) && (
              <p>
                {user.city}
                {user.city && user.state && ", "}
                {user.state} {user.postal}
              </p>
            )}
            {user.country && <p>{user.country}</p>}
            {user.phone && <p>{user.phone}</p>}
          </div>
          <button
            className="flex items-center justify-center rounded-md hover:bg-secondary ml-auto h-8 w-8 transition-colors"
            onClick={() => setDisplayForm(true)}
          >
            <Pencil size={18} />
          </button>
        </>
      )}
    </div>
  );
};

export default AccountDetails;

