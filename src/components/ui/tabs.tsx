import React from "react";
import { cn } from "./cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("tab-bar", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(activeTab === tab.id ? "tab-item-active" : "tab-item")}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
