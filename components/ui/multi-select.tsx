"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      {label && <div className="mb-1 text-white font-medium">{label}</div>}
      <div
        className={`flex flex-wrap gap-1 items-center min-h-[44px] bg-zinc-800 border border-gray-500 rounded px-2 py-1 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-red-500"}`}
        onClick={() => !disabled && setOpen(v => !v)}
        role="button"
        tabIndex={0}
      >
        {value.length === 0 && (
          <span className="text-gray-400 select-none">{placeholder}</span>
        )}
        {value.map(val => {
          const opt = options.find(o => o.value === val);
          if (!opt) return null;
          return (
            <span
              key={val}
              className="flex items-center bg-red-700/80 text-white rounded px-2 py-0.5 text-sm mr-1 mb-1 gap-1"
            >
              {opt.label}
              <button
                type="button"
                className="ml-1 focus:outline-none"
                onClick={e => {
                  e.stopPropagation();
                  onChange(value.filter(v => v !== val));
                }}
                aria-label="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-gray-600 rounded shadow-lg max-h-60 overflow-auto animate-in fade-in">
          <input
            className="w-full px-2 py-1 bg-zinc-900 text-white border-b border-zinc-700 focus:outline-none text-sm"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-gray-400 text-sm">No options</div>
            )}
            {filtered.map(opt => (
              <div
                key={opt.value}
                className={`flex items-center px-2 py-2 cursor-pointer hover:bg-zinc-700 text-white text-sm ${value.includes(opt.value) ? "bg-red-700/40" : ""}`}
                onClick={e => {
                  e.stopPropagation();
                  if (value.includes(opt.value)) {
                    onChange(value.filter(v => v !== opt.value));
                  } else {
                    onChange([...value, opt.value]);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  readOnly
                  className="mr-2 accent-red-600"
                />
                {opt.label}
                {value.includes(opt.value) && <Check className="w-4 h-4 ml-auto text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
