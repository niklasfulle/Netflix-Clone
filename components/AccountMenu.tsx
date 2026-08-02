"use client";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrentUser } from "@/hooks/use-current-user";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { UserRole } from "@prisma/client";

interface AccountMenuProps {
  visible?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible }) => {
  const user = useCurrentUser();
  const { data: profil } = useCurrentProfil();
  const { t } = useLanguage();

  if (!visible) {
    return null;
  }

  if (profil == undefined) {
    return null;
  }

  let profilImg = "placeholder.png";
  if (profil != undefined) {
    profilImg = profil.image ?? "placeholder.png";
  }

  return (
    <div id="account-menu" className="absolute right-0 flex flex-col w-56 py-2 bg-black border-2 border-gray-800 top-14">
      <div className="flex flex-col gap-3">
        <Link href="/profiles">
          <div className="flex flex-row items-center w-full  gap-4 px-3 py-1 group/item">
            <Image
              className="md:w-10 w-8 rounded-md"
              src={`/images/profil/${profilImg}`}
              alt=""
              width={320}
              height={320}
            />
            <p className="text-sm text-white group-hover/item:underline">
              {profil?.name}
            </p>
          </div>
        </Link>
        {user?.role == UserRole.ADMIN && (
          <>
            <hr className="h-px bg-gray-600 border-0" />
            <Link href="/admin">
              <div className="flex flex-row items-center justify-center md:p-2 text-center text-white px-3 text-sm hover:underline">
                {t('Admin')}
              </div>
            </Link>
          </>
        )}
        <hr className="h-px bg-gray-600 border-0" />
        <Link href="/settings">
          <div className="flex flex-row items-center justify-center md:p-2 text-center text-white px-3 text-sm hover:underline">
            {t('Settings')}
          </div>
        </Link>
        <hr className="h-px bg-gray-600 border-0" />
        <button
          type="button"
          className="flex w-full flex-row items-center justify-center px-3 text-center text-sm text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 md:p-2"
          onClick={() => signOut()}
        >
          {t('Sign out of Netflix')}
        </button>
      </div>
    </div>
  );
};

export default AccountMenu;
