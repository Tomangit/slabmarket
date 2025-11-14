import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Card {
  id: string;
  name: string;
  card_number: string | null;
  year: number | null;
}

interface CardNumberComboboxProps {
  cards: Card[];
  value: string | null;
  onChange: (cardId: string | null) => void;
  isLoading?: boolean;
}

export function CardNumberCombobox({ cards, value, onChange, isLoading }: CardNumberComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedCard = useMemo(() => cards.find((card) => card.id === value), [cards, value]);

  // Sort cards numerically by card_number
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      // If no card_number, put at the end
      if (!a.card_number && !b.card_number) {
        return a.name.localeCompare(b.name);
      }
      if (!a.card_number) return 1;
      if (!b.card_number) return -1;

      // Extract number before "/" (e.g., "1/102" -> 1)
      const getCardNumber = (cardNumber: string): number => {
        const match = cardNumber.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const numA = getCardNumber(a.card_number);
      const numB = getCardNumber(b.card_number);

      if (numA !== numB) {
        return numA - numB;
      }

      // If numbers are equal, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [cards]);

  const buttonLabel = selectedCard
    ? selectedCard.card_number
      ? `${selectedCard.card_number} - ${selectedCard.name}`
      : selectedCard.name
    : cards.length === 0
    ? "Select a set first"
    : "Select card number";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading || cards.length === 0}
        >
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80 max-h-96" side="bottom" align="start">
        <Command className="grid max-h-96 grid-rows-[auto_1fr]">
          <div className="px-2 py-2">
            <CommandInput placeholder="Search card..." className="h-9" />
          </div>
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandEmpty>
              {sortedCards.length === 0 ? "Select a set first" : "No cards found."}
            </CommandEmpty>
            {sortedCards.length > 0 && (
              <CommandGroup>
                {sortedCards.map((card) => (
                  <CommandItem
                    key={card.id}
                    value={`${card.card_number || ""} ${card.name}`}
                    onSelect={() => {
                      onChange(card.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2", value === card.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="truncate">
                        {card.card_number ? `${card.card_number} - ` : ""}
                        {card.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

