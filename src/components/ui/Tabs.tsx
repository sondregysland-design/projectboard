"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onTabChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className="flex gap-1 bg-warm-sand/50 p-1 rounded-lg overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActive(tab.id);
            onTabChange?.(tab.id);
          }}
          className={`px-2.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-ivory text-near-black shadow-[0px_0px_0px_1px_#f0eee6]"
              : "text-olive hover:text-near-black"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-2 text-xs ${
                active === tab.id ? "text-terracotta" : "text-stone"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
