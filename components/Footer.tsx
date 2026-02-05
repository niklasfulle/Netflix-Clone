"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const Footer = () => {
  // Version und Jahr nur auf dem Client dynamisch setzen
  const version = "1.7.1";
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="w-full flex flex-row gap-10 p-2 nd:p-3 justify-center bg-zinc-800">
      <div className=" text-zinc-400 text-xs md:text-sm">
        <p>
          &copy; {year} Copyright:{" "}
          <span className="text-zinc-200">Niklas Fulle</span>
        </p>
      </div>
      <div className=" text-zinc-400 text-xs md:text-sm">
        Version: <span className="text-zinc-200">{version}</span>
      </div>
      <div className=" text-zinc-200 text-xs md:text-sm underline hover:text-zinc-400">
        <Link href="/changelog">Change Log</Link>
      </div>
    </div>
  );
};

export default Footer;
