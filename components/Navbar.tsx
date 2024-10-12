import { FaChevronDown } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import Image from "next/image";
import SearchItem from "@/components/SearchItem";
import NavbarItem from "@/components/NavbarItem";
import MobileMenu from "@/components/MobileMenu";
import AccountMenu from "@/components/AccountMenu";

const TOP_OFFSET = 66;

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const { data: profil } = useCurrentProfil();

  useEffect(() => {
    const handleScroll = () => {
      if (window.screenY >= TOP_OFFSET) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

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
    profilImg = profil.image;
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
        />
        <Image
          className="block w-auto h-10 md:hidden"
          src="/images/Logo2.png"
          alt="Logo"
          width={500}
          height={500}
        />
        <div className="flex-row hidden ml-8 gap-7 lg:flex">
          <NavbarItem label="Home" href="/" />
          <NavbarItem label="Series" href="/series" />
          <NavbarItem label="Films" href="/movies" />
          <NavbarItem label="My List" href="/mylist" />
        </div>
        <div
          onClick={toggleMobileMenu}
          className="relative flex flex-row items-center gap-2 ml-4 cursor-pointer md:ml-8 lg:hidden"
        >
          <p className="text-sm text-white">Browse</p>
          <FaChevronDown
            className={`text-white transition mr-4 ${
              showMobileMenu ? "rotate-180" : "rotate-0"
            }`}
          />
          <MobileMenu visible={showMobileMenu} />
        </div>
        <div className="flex flex-row items-center ml-auto gap-7">
          <SearchItem />
          <div
            onClick={toggleAccountMenu}
            className="relative flex flex-row items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 overflow-hidden rounded-md sm:w-10 sm:h-10">
              <Image
                src={`/images/profil/${profilImg}`}
                alt="Profile"
                width={320}
                height={320}
              />
            </div>
            <FaChevronDown
              className={`text-white transition ${
                showAccountMenu ? "rotate-180" : "rotate-0"
              }`}
            />
            <AccountMenu visible={showAccountMenu} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
