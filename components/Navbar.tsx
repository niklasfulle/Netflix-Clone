"use client";
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

import AccountMenu from '@/components/AccountMenu';
import MobileMenu from '@/components/MobileMenu';
import NavbarItem from '@/components/NavbarItem';
import SearchItem from '@/components/SearchItem';
import { useLanguage } from '@/components/providers/LanguageProvider';
import useCurrentProfil from '@/hooks/useCurrentProfil';

const TOP_OFFSET = 66;

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const { data: profil } = useCurrentProfil();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= TOP_OFFSET) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu((current) => !current);
  }, []);

  const toggleAccountMenu = useCallback(() => {
    setShowAccountMenu((current) => !current);
  }, []);

  let profilImg = "placeholder.png";
  if (profil != undefined) {
    profilImg = profil.image ?? "placeholder.png";
  }
  return (
    <nav className="fixed z-40 w-full bg-black bg-opacity-30">
      <div
        className={`px-4 md:px-16 py-3 md:py-6 flex flex-row items-center transition duration-500 ${
          showBackground ? "bg-zinc-900 bg-opacity-90" : ""
        }`}
      >
        <Image
          className="hidden w-auto h-7 lg:h-7 md:block"
          src="/images/Logo.png"
          alt="Logo"
          width={100}
          height={100}
          priority
        />
        <Image
          className="block w-auto h-10 md:hidden"
          src="/images/Logo2.png"
          alt="Logo"
          width={500}
          height={500}
          priority
        />
        <div className="flex-row hidden ml-8 gap-7 lg:flex">
          <NavbarItem label={t('Home')} href="/" />
          <NavbarItem label={t('Movies')} href="/movies" />
          <NavbarItem label={t('Series')} href="/series" />
          <NavbarItem label={t('Favorites')} href="/mylist" />
          <NavbarItem label={t('Playlists')} href="/playlists" />
          <NavbarItem label={t('Watchlist')} href="/watchlist" />
          <NavbarItem label={t('Random')} href="/random" />
        </div>
        <div className="relative ml-4 md:ml-8 lg:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-catalog-menu"
            className="flex flex-row items-center gap-2 cursor-pointer"
          >
            <p className="text-base text-white">{t('Browse')}</p>
            <FaChevronDown
              className={`mr-4 text-white transition ${
                showMobileMenu ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
          <MobileMenu visible={showMobileMenu} />
        </div>
        <div className="flex flex-row items-center ml-auto gap-7">
          <SearchItem />
          <div className="relative flex flex-row items-center">
            <button
              type="button"
              aria-label={t('Account')}
              aria-expanded={showAccountMenu}
              aria-controls="account-menu"
              onClick={toggleAccountMenu}
              className="flex flex-row items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 overflow-hidden rounded-md sm:w-10 sm:h-10">
                <Image
                  src={`/images/profil/${profilImg}`}
                  alt={t('Profile')}
                  width={320}
                  height={320}
                  loading="eager"
                />
              </div>
              <FaChevronDown
                className={`text-white transition ${
                  showAccountMenu ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            <AccountMenu visible={showAccountMenu} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
