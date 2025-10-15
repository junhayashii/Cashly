"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  enabled: boolean; // true = dark, false = light
  onToggle: () => void; // 切替関数
}

export function ThemeToggle({ enabled, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="relative"
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all ${
          enabled ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
          enabled ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
