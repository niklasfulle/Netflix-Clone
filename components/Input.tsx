import React from "react";

interface InputProps {
  id: string;
  onChange: any;
  onKeyDown: any;
  value: string;
  lable: string;
  type?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  onChange,
  value,
  lable,
  type,
  onKeyDown,
}) => {
  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        type={type}
        className="block w-full px-3 pt-6 pb-1 text-white rounded-md appearance-none text-md bg-neutral-700 focus:outline-none focus:ring-0 peer"
        placeholder=" "
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <label
        className="absolute text-md text-zinc-400 duration-150 transfrom -translate-y-3 scale-75 top-4 z-10 origin-[0] left-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
        htmlFor={id}
      >
        {lable}
      </label>
    </div>
  );
};

export default Input;
