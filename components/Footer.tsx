"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/version";
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Footer = () => {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="w-full flex flex-col md:flex-row gap-2 md:gap-10 p-2 md:p-3 justify-center items-center bg-zinc-800">
      <div className=" text-zinc-400 text-xs md:text-sm text-center md:text-left">
        <p>
          &copy; {year} Copyright:{" "}
          <span className="text-zinc-200">Niklas Fulle</span>
        </p>
      </div>
      <div className=" text-zinc-400 text-xs md:text-sm text-center md:text-left">
        Version: <span className="text-zinc-200">{APP_VERSION}</span>
      </div>
      <div className=" text-zinc-200 text-xs md:text-sm underline hover:text-zinc-400 text-center md:text-left">
        <Link href="/changelog">Change Log</Link>
      </div>
      <LanguageSwitcher />
    </div>
  );
};

export default Footer;
