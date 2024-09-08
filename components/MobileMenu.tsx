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
    <div className="absolute left-0 flex flex-col w-56 py-5 bg-black border-2 border-gray-800 top-8">
      <div className="flex flex-col gap-4">
        <Link href={"/"}>
          <div className="px-3 text-center text-white hover:underline">
            Home
          </div>
        </Link>
        <Link href={"/series"}>
          <div className="px-3 text-center text-white hover:underline">
            Series
          </div>
        </Link>
        <Link href={"/movies"}>
          <div className="px-3 text-center text-white hover:underline">
            Films
          </div>
        </Link>
        <Link href={"/mylist"}>
          <div className="px-3 text-center text-white hover:underline">
            My List
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;
