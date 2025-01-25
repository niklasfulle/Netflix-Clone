const Footer = () => {
  return (
    <div className="w-full flex flex-row gap-10 p-2 nd:p-3 justify-center bg-zinc-800">
      <div className=" text-zinc-400 text-xs md:text-sm">
        <p>
          &copy; {new Date().getFullYear()} Copyright:{" "}
          <span className="text-zinc-200">Niklas Fulle</span>
        </p>
      </div>
      <div className=" text-zinc-400 text-xs md:text-sm">
        Version: <span className="text-zinc-200">1.3.0</span>
      </div>
    </div>
  );
};

export default Footer;
