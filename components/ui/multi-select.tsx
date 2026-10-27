"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  recentValues?: string[];
  otherOptionsLabel?: string;
}

interface OptionGroup {
  key: string;
  label: string | null;
  options: Option[];
}

function toggleOption(value: string, selected: string[], onChange: (value: string[]) => void) {
  onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
}

function OptionGroup({ group, value, onChange }: Readonly<{
  group: OptionGroup;
  value: string[];
  onChange: (value: string[]) => void;
}>) {
  if (!group.options.length) return null;
  return <div>
    {group.label && <p className="border-b border-zinc-800 px-2 pb-1 pt-3 text-xs font-semibold text-zinc-400">{group.label}</p>}
    {group.options.map(opt => <label key={opt.value} className={`flex cursor-pointer items-center px-2 py-2 text-sm text-white hover:bg-zinc-700 ${value.includes(opt.value) ? 'bg-red-700/40' : ''}`}>
      <input type="checkbox" checked={value.includes(opt.value)} onChange={() => toggleOption(opt.value, value, onChange)} className="mr-2 accent-red-600" />
      {opt.label}
      {value.includes(opt.value) && <Check className="ml-auto h-4 w-4 text-red-500" />}
    </label>)}
  </div>;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  recentValues = [],
  otherOptionsLabel,
}) => {
  const { t } = useLanguage();
  const placeholderText = placeholder ?? t("Select...");
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

  const query = search.trim().toLowerCase();
  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  );
  const recentOptions = query ? [] : [...new Set(recentValues)]
    .map(id => options.find(option => option.value === id))
    .filter((option): option is Option => option !== undefined);
  const recentIds = new Set(recentOptions.map(option => option.value));
  const groups: OptionGroup[] = recentOptions.length > 0 ? [
    { key: "recent", label: t("Recently used"), options: recentOptions },
    { key: "other", label: otherOptionsLabel ?? t("All options"), options: filtered.filter(option => !recentIds.has(option.value)) },
  ] : [{ key: "all", label: null, options: filtered }];

  return (
    <div className="relative" ref={ref}>
      {label && <div className="mb-1 text-white font-medium">{label}</div>}
      <div className="relative min-h-[44px]">
        <button
          type="button"
          data-multi-select-trigger
          aria-expanded={open}
          aria-label={label ?? placeholderText}
          disabled={disabled}
          onClick={() => setOpen(v => !v)}
          className={`absolute inset-0 z-0 min-h-[44px] w-full cursor-pointer rounded border border-gray-500 bg-zinc-800 px-2 py-1 text-left ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-red-500"}`}
        />
        <div className="pointer-events-none relative z-10 flex min-h-[44px] flex-wrap items-center gap-1 px-2 py-1">
          {value.length === 0 && (
            <span className="select-none text-gray-400">{placeholderText}</span>
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
                  disabled={disabled}
                  onClick={e => {
                    e.stopPropagation();
                    onChange(value.filter(v => v !== val));
                  }}
                  aria-label={t("Remove")}
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
            placeholder={t("Search...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-gray-400 text-sm">{t("No options")}</div>
            )}
            {groups.map(group => <OptionGroup key={group.key} group={group} value={value} onChange={onChange} />)}
          </div>
        </div>
      )}
    </div>
  );
};
