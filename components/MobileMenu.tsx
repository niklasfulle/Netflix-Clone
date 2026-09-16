import Link from "next/link";
import React from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface MobileMenuProps {
  visible?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  const { t } = useLanguage();

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
            {t('Home')}
          </div>
        </Link>
        <Link href={"/movies"}>
          <div className="px-3 text-center text-white hover:underline ">
            {t('Movies')}
          </div>
        </Link>
        <Link href={"/series"}>
          <div className="px-3 text-center text-white hover:underline">
            {t('Series')}
          </div>
        </Link>
        <Link href={"/mylist"}>
          <div className="px-3 text-center text-white hover:underline">
            {t('Favorites')}
          </div>
        </Link>
        <Link href={"/playlists"}>
          <div className="px-3 text-center text-white hover:underline">
            {t('Playlists')}
          </div>
        </Link>
        <Link href={"/watchlist"}>
          <div className="px-3 text-center text-white hover:underline">
            {t('Watchlist')}
          </div>
        </Link>
        <Link href={"/random"}>
          <div className="px-3 text-center text-white hover:underline">
            {t('Random')}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;
