import { useMemo, useState } from "react";
import { Check, Globe, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PokemonSet } from "@/data/pokemonSetCatalog";
import { pokemonSetReleaseYears } from "@/data/pokemonSetReleaseYears";

// Reverse mapping for search aliases (catalog name -> original names)
const setSearchAliases: Record<string, string[]> = {
  "Nintendo Black Star Promo": ["Wizards Black Star Promos", "Wizards Black Star Promo", "WBSP"],
};

const languageLabels: Record<string, string> = {
  english: "English Sets",
  japanese: "Japanese Sets",
};

const languageOrder = ["english", "japanese"];

interface SetComboboxProps {
  sets: PokemonSet[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function SetCombobox({ sets, value, onChange, isLoading }: SetComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => sets.find((set) => set.slug === value), [sets, value]);

  const groupedSets = useMemo(() => {
    const byLanguage = new Map<string, Map<string, PokemonSet[]>>();

    sets.forEach((set) => {
      const releaseYear =
        set.releaseYear ??
        pokemonSetReleaseYears[`${set.language}-${set.name}`] ??
        pokemonSetReleaseYears[`${set.language}-${set.name.replace(/:/g, "")}`];
      const enriched: PokemonSet = releaseYear ? { ...set, releaseYear } : set;

      const languageSets = byLanguage.get(enriched.language) ?? new Map<string, PokemonSet[]>();
      if (!byLanguage.has(enriched.language)) {
        byLanguage.set(enriched.language, languageSets);
      }

      const items = languageSets.get(enriched.era) ?? [];
      languageSets.set(enriched.era, [...items, enriched]);
    });

    languageOrder.forEach((language) => {
      const eraMap = byLanguage.get(language);
      if (!eraMap) {
        return;
      }
      eraMap.forEach((value, era) => {
        const sorted = [...value].sort((a, b) => {
          const yearDiff = (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
          if (yearDiff !== 0) {
            return yearDiff;
          }
          return a.name.localeCompare(b.name);
        });
        eraMap.set(era, sorted);
      });
    });

    return byLanguage;
  }, [sets]);

  const buttonLabel = value === "all" || !selectedSet ? "All sets" : selectedSet.name;
  const buttonYear =
    value === "all" || !selectedSet || !selectedSet.releaseYear ? undefined : selectedSet.releaseYear;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            {value === "all" ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Languages className="h-4 w-4 text-muted-foreground" />}
            <span className="truncate">{buttonLabel}</span>
          </span>
          <span className="flex items-center gap-1">
            {buttonYear ? <Badge variant="secondary">{buttonYear}</Badge> : null}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80 max-h-96" side="bottom" align="start">
        <Command className="grid max-h-96 grid-rows-[auto_1fr]">
          <div className="px-2 py-2">
            <CommandInput placeholder="Search sets..." className="h-9" />
          </div>
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandEmpty>No sets found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all All sets"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2", value === "all" ? "opacity-100" : "opacity-0")} />
                All sets
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {languageOrder
              .filter((language) => groupedSets.has(language))
              .map((language, languageIndex) => {
                const eraMap = groupedSets.get(language);
                if (!eraMap) {
                  return null;
                }
                const eras = Array.from(eraMap.entries())
                  .map(([era, eraSets]) => ({
                    era,
                    sets: eraSets,
                    latestYear: eraSets.reduce((acc, item) => Math.max(acc, item.releaseYear ?? 0), 0),
                  }))
                  .sort((a, b) => {
                    if (a.latestYear !== b.latestYear) {
                      return b.latestYear - a.latestYear;
                    }
                    return a.era.localeCompare(b.era);
                  });
                return (
                  <div key={language}>
                    <CommandGroup heading={languageLabels[language] ?? language}>
                      {eras.map(({ era, sets: eraSets }) => (
                        <div key={era} className="space-y-1">
                          <p className="px-2 text-xs font-semibold text-muted-foreground">{era}</p>
                          {eraSets.map((set) => {
                            // Add search aliases to value for better searchability
                            const aliases = setSearchAliases[set.name] || [];
                            const searchValue = `${set.name} ${set.slug} ${aliases.join(" ")}`.toLowerCase();
                            
                            return (
                            <CommandItem
                              key={set.slug}
                              value={searchValue}
                              onSelect={() => {
                                onChange(set.slug);
                                setOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2", value === set.slug ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-1 items-center justify-between gap-2">
                                <span className="truncate">{set.name}</span>
                                {set.releaseYear ? (
                                  <Badge variant="outline" className="text-[10px] uppercase">
                                    {set.releaseYear}
                                  </Badge>
                                ) : null}
                              </div>
                            </CommandItem>
                            );
                          })}
                        </div>
                      ))}
                    </CommandGroup>
                    {languageIndex < languageOrder.length - 1 ? <CommandSeparator /> : null}
                  </div>
                );
              })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

