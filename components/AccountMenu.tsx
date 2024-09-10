import useCurrentProfil from "@/hooks/useCurrentProfil";
import useCurrentUser from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";

interface AccountMenuProps {
  visible?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visible }) => {
  const { data: user } = useCurrentUser();
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
          className="flex flex-row items-center w-full gap-4 px-3 group/item"
        >
          <Image
            className="w-10 rounded-md"
            src={`/images/profil/${profilImg}`}
            alt=""
            width={320}
            height={320}
          />
          <p className="text-sm text-white group-hover/item:underline">
            {profil?.name}
          </p>
        </div>
        {user.role == "admin" && (
          <>
            <hr className="h-px my-2 bg-gray-600 border-0" />
            <div
              className="px-3 text-sm text-center text-white hover:underline"
              onClick={() => router.push("/add")}
            >
              Add new Movies
            </div>
          </>
        )}
        <hr className="h-px my-2 bg-gray-600 border-0" />
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
