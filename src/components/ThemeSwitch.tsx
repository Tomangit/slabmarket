"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { 
    value: "light", 
    label: "Light", 
    icon: Sun, 
    preview: "bg-gradient-to-br from-white via-blue-50 to-white",
    description: "Clean & Professional"
  },
  { 
    value: "dark", 
    label: "Dark", 
    icon: Moon, 
    preview: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900",
    description: "Modern & Elegant"
  },
];

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined' && theme) {
      // Ensure theme class is applied to html element
      const html = document.documentElement;
      // Remove all theme classes
      html.classList.remove('light', 'dark');
      // Add current theme class
      if (theme !== 'system') {
        html.classList.add(theme);
      }
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const currentTheme = themes.find((t) => t.value === theme) || themes[1];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <CurrentIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Choose theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => {
                setTheme(themeOption.value);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded-md border-2 shadow-sm transition-all ${themeOption.preview} ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border group-hover:border-primary/50'}`} />
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{themeOption.label}</span>
                </div>
                {themeOption.description && (
                  <span className="text-xs text-muted-foreground">{themeOption.description}</span>
                )}
              </div>
              {isSelected && (
                <span className="text-primary font-bold">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
