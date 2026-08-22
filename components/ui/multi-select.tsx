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
      <div className="relative min-h-[44px]">
        <button
          type="button"
          data-multi-select-trigger
          aria-expanded={open}
          aria-label={label ?? placeholder}
          disabled={disabled}
          onClick={() => setOpen(v => !v)}
          className={`absolute inset-0 z-0 min-h-[44px] w-full cursor-pointer rounded border border-gray-500 bg-zinc-800 px-2 py-1 text-left ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-red-500"}`}
        />
        <div className="pointer-events-none relative z-10 flex min-h-[44px] flex-wrap items-center gap-1 px-2 py-1">
          {value.length === 0 && (
            <span className="select-none text-gray-400">{placeholder}</span>
          )}
          {value.map(val => {
            const opt = options.find(o => o.value === val);
            if (!opt) return null;
            return (
              <span
                key={val}
                className="mr-1 mb-1 flex items-center gap-1 rounded bg-red-700/80 px-2 py-0.5 text-sm text-white"
              >
                {opt.label}
                <button
                  type="button"
                  className="pointer-events-auto ml-1 focus:outline-none"
                  onClick={e => {
                    e.stopPropagation();
                    onChange(value.filter(v => v !== val));
                  }}
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
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
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center px-2 py-2 text-sm text-white hover:bg-zinc-700 ${value.includes(opt.value) ? "bg-red-700/40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => {
                    if (value.includes(opt.value)) {
                      onChange(value.filter(v => v !== opt.value));
                    } else {
                      onChange([...value, opt.value]);
                    }
                  }}
                  className="mr-2 accent-red-600"
                />
                {opt.label}
                {value.includes(opt.value) && <Check className="w-4 h-4 ml-auto text-red-500" />}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
