import useCurrentProfil from "@/hooks/useCurrentProfil";
import useCurrentUser from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";

interface AccountMenuProps {
  visible?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible }) => {
  const { data: profil } = useCurrentProfil();
  const router = useRouter();

  if (!visible) {
    return null;
  }

  if (profil == undefined) {
    return null;
  }

  let profilImg = "placeholder.png";
  if (profil != undefined) {
    profilImg = profil.image;
  }
  return (
    <div className="absolute right-0 flex flex-col w-56 py-5 bg-black border-2 border-gray-800 top-14">
      <div className="flex flex-col gap-3">
        <div
          onClick={() => {
            router.push("/profiles");
          }}
          className="flex flex-row items-center w-full gap-3 px-3 group/item"
        >
          <img
            className="w-8 rounded-md"
            src={`images/profil/${profilImg}`}
            alt=""
          />
          <p className="text-sm text-white group-hover/item:underline">
            {profil?.name}
          </p>
        </div>
        <hr className="h-px my-4 bg-gray-600 border-0" />
        <div
          className="px-3 text-sm text-center text-white hover:underline"
          onClick={() => signOut()}
        >
          Sign out of Netflix
        </div>
      </div>
    </div>
  );
};

export default AccountMenu;
