import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  allPokemonSets,
  findSetBySlug as findStaticSetBySlug,
  pokemonEnglishSets,
  pokemonJapaneseSets,
  type PokemonSet,
} from "@/data/pokemonSetCatalog";

type DbSet = Database["public"]["Tables"]["sets"]["Row"];

// Map set names from API/database to catalog names
const setNameMapping: Record<string, string> = {
  "Wizards Black Star Promos": "Nintendo Black Star Promo",
  "Wizards Black Star Promo": "Nintendo Black Star Promo",
  "WBSP": "Nintendo Black Star Promo",
};

function normalizeSetName(setName: string): string {
  return setNameMapping[setName] || setName;
}

function mapDbSet(set: DbSet): PokemonSet {
  const fallback = findStaticSetBySlug(set.id);
  return {
    slug: set.id,
    name: set.name,
    era: set.era,
    language: (set.language as PokemonSet["language"]) ?? fallback?.language ?? "english",
    releaseYear: set.release_year ?? fallback?.releaseYear ?? undefined,
  };
}

export const setService = {
  async getAllSets(): Promise<PokemonSet[]> {
    const { data, error } = await supabase
      .from("sets")
      .select("*")
      .order("language", { ascending: true })
      .order("era", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return allPokemonSets;
    }

    const mapped = data.map(mapDbSet);
    
    // Also get unique set names from cards table to include sets that might not be in the sets table
    const { data: cardsData } = await supabase
      .from("cards")
      .select("set_name")
      .not("set_name", "is", null);

    if (cardsData) {
      const cardSetNames = new Set(cardsData.map((c) => c.set_name).filter(Boolean));
      const existingSetNames = new Set(mapped.map((s) => s.name));
      
      // Add missing sets from cards as fallback sets
      cardSetNames.forEach((setName) => {
        if (!setName) return;
        
        // Normalize set name using mapping
        const normalizedName = normalizeSetName(setName);
        
        // Check if normalized name already exists
        if (existingSetNames.has(normalizedName)) {
          return; // Already in the list
        }
        
        // Try to find a matching set in static catalog by exact name first
        let staticSet = allPokemonSets.find((s) => 
          s.name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        // If not found, try similarity matching
        if (!staticSet) {
          staticSet = allPokemonSets.find((s) => 
            s.name.toLowerCase().includes(normalizedName.toLowerCase()) ||
            normalizedName.toLowerCase().includes(s.name.toLowerCase())
          );
        }
        
        if (staticSet) {
          // Use the static set if found
          if (!mapped.find((s) => s.name === staticSet!.name)) {
            mapped.push(staticSet);
            existingSetNames.add(staticSet.name);
          }
        } else {
          // Create a fallback set for sets that exist in cards but not in catalog
          const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          mapped.push({
            slug: `fallback-${slug}`,
            name: normalizedName,
            era: "Unknown",
            language: "english",
          });
          existingSetNames.add(normalizedName);
        }
      });
    }

    return mapped;
  },

  async getEnglishSets(): Promise<PokemonSet[]> {
    const sets = await this.getAllSets();
    const filtered = sets.filter((set) => set.language === "english");
    if (filtered.length === 0) {
      return pokemonEnglishSets;
    }
    return filtered;
  },

  async getJapaneseSets(): Promise<PokemonSet[]> {
    const sets = await this.getAllSets();
    const filtered = sets.filter((set) => set.language === "japanese");
    if (filtered.length === 0) {
      return pokemonJapaneseSets;
    }
    return filtered;
  },

  findStaticSetBySlug(slug: string): PokemonSet | undefined {
    return findStaticSetBySlug(slug);
  },
};

