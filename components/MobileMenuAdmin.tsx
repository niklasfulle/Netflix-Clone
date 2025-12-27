import Link from "next/link";
import React from "react";

interface MobileMenuProps {
  visible?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="absolute left-0 flex flex-col w-44 py-4 bg-black border-2 border-gray-800 top-8">
      <div className="flex flex-col gap-4">
        <Link href={"/"}>
          <div className="px-3 text-center text-white hover:underline">
            Home
          </div>
        </Link>
        <Link href={"/admin/users"}>
          <div className="px-3 text-center text-white hover:underline ">
            User
          </div>
        </Link>
        <Link href={"/admin/actors"}>
          <div className="px-3 text-center text-white hover:underline ">
            Actors
          </div>
        </Link>
        <Link href={"/admin/movies"}>
          <div className="px-3 text-center text-white hover:underline">
            Movies/Series
          </div>
        </Link>
        <Link href={"/admin/statistics"}>
          <div className="px-3 text-center text-white hover:underline">
            Statistics
          </div>
        </Link>
        <Link href={"/admin/logs"}>
          <div className="px-3 text-center text-white hover:underline">
            Logs
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;
