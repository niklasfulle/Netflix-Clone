"use client";
import { useEffect, useState } from "react";

const Footer = () => {
  // Version und Jahr nur auf dem Client dynamisch setzen
  const version = "1.6.1";
  const [year, setYear] = useState(2025);

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
    </div>
  );
};

export default Footer;
