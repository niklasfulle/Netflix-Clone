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
    <div
      id="mobile-catalog-menu"
      className="absolute left-0 top-8 flex w-44 flex-col border-2 border-gray-800 bg-black py-4"
    >
      <div className="flex flex-col gap-4">
        <Link href={"/"}>
          <div className="px-3 text-center text-white hover:underline">
            Home
          </div>
        </Link>
        <Link href={"/movies"}>
          <div className="px-3 text-center text-white hover:underline ">
            Movies
          </div>
        </Link>
        <Link href={"/series"}>
          <div className="px-3 text-center text-white hover:underline">
            Series
          </div>
        </Link>
        <Link href={"/mylist"}>
          <div className="px-3 text-center text-white hover:underline">
            My List
          </div>
        </Link>
        <Link href={"/playlists"}>
          <div className="px-3 text-center text-white hover:underline">
            Playlists
          </div>
        </Link>
        <Link href={"/watchlist"}>
          <div className="px-3 text-center text-white hover:underline">
            Watchlist
          </div>
        </Link>
        <Link href={"/random"}>
          <div className="px-3 text-center text-white hover:underline">
            Random
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;
