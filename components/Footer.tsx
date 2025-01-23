const Footer = () => {
  return (
    <div className="w-full flex flex-row gap-10 p-2 nd:p-3 justify-center bg-zinc-800">
      <div className=" text-zinc-400 text-xs md:text-sm">
        &copy; {new Date().getFullYear()} Copyright:{" "}
        <a className="text-zinc-200">Niklas Fulle</a>
      </div>
      <div className=" text-zinc-400 text-xs md:text-sm">
        Version: <a className="text-zinc-200">1.2.0</a>
      </div>
    </div>
  );
};

export default Footer;
