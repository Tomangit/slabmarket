import { slugify } from "@/lib/slugify";
import { pokemonSetReleaseYears } from "./pokemonSetReleaseYears";

export type PokemonSetLanguage = "english" | "japanese";

export interface PokemonSet {
  slug: string;
  name: string;
  era: string;
  language: PokemonSetLanguage;
  releaseYear?: number;
}

interface EraDefinition {
  era: string;
  names: string[];
  englishEraLabel?: string;
  japaneseEraLabel?: string;
}

const englishEraDefaults: Record<string, number> = {
  "Mega Evolution": 2014,
  "Scarlet & Violet": 2023,
  "Sword & Shield": 2020,
  "Sun & Moon": 2017,
  XY: 2014,
  "Black & White": 2011,
  "Call of Legends": 2011,
  "HeartGold SoulSilver": 2010,
  Platinum: 2009,
  "Diamond & Pearl": 2007,
  "EX Ruby & Sapphire": 2003,
  "e-Card": 2002,
  "Legendary Collection": 2002,
  Neo: 2000,
  Gym: 2000,
  Base: 1999,
};

const japaneseEraDefaults: Record<string, number> = {
  "Scarlet & Violet": 2023,
  "Sword & Shield": 2019,
  "Sun & Moon": 2016,
  XY: 2013,
  "Black & White": 2011,
  "Diamond & Pearl": 2006,
  "e-Card": 2001,
  Neo: 1999,
  Gym: 1998,
  Base: 1996,
};

function inferReleaseYear(language: PokemonSetLanguage, era: string, name: string): number {
  const override = pokemonSetReleaseYears[`${language}-${name}`];
  if (override) {
    return override;
  }

  const yearFromName = name.match(/\b(19|20)\d{2}\b/);
  if (yearFromName) {
    return parseInt(yearFromName[0], 10);
  }

  const base =
    language === "english" ? englishEraDefaults[era] ?? 2000 : japaneseEraDefaults[era] ?? 2000;
  return base;
}

const englishDefinitions: EraDefinition[] = [
  {
    era: "Mega Evolution",
    names: ["Mega Evolution", "Mega Evolution Promos"],
  },
  {
    era: "Scarlet & Violet",
    names: [
      "White Flare",
      "Black Bolt",
      "Destined Rivals",
      "Journey Together",
      "McDonald's Dragon Discovery",
      "Prismatic Evolutions",
      "Surging Sparks",
      "Stellar Crown",
      "Trick or Trade 2024",
      "Shrouded Fable",
      "Twilight Masquerade",
      "Temporal Forces",
      "Paldean Fates",
      "Paradox Rift",
      "Pokemon Card 151",
      "Trick or Trade 2023",
      "Obsidian Flames",
      "McDonald's Promos 2023",
      "Paldea Evolved",
      "Scarlet & Violet Base",
      "Scarlet & Violet Promos",
    ],
  },
  {
    era: "Sword & Shield",
    names: [
      "Trading Card Game Classic",
      "Crown Zenith",
      "Silver Tempest",
      "Lost Origin",
      "Trick or Trade 2022",
      "McDonald's Promos 2022",
      "Pokemon GO",
      "Astral Radiance",
      "Brilliant Stars",
      "Fusion Strike",
      "Celebrations",
      "Celebrations: Classic Collection",
      "Evolving Skies",
      "Chilling Reign",
      "Battle Styles",
      "Shining Fates",
      "McDonald's 25th Anniversary",
      "Vivid Voltage",
      "Champion's Path",
      "Darkness Ablaze",
      "Rebel Clash",
      "Sword & Shield",
      "Sword & Shield Promo",
    ],
  },
  {
    era: "Sun & Moon",
    names: [
      "Cosmic Eclipse",
      "McDonald's Promos 2019",
      "Hidden Fates",
      "Unified Minds",
      "Unbroken Bonds",
      "Detective Pikachu",
      "Team Up",
      "Lost Thunder",
      "McDonald's Promos 2018",
      "Dragon Majesty",
      "Celestial Storm",
      "Forbidden Light",
      "Ultra Prism",
      "Crimson Invasion",
      "Shining Legends",
      "Burning Shadows",
      "McDonald's Promos 2017",
      "Guardians Rising",
      "Sun & Moon",
      "Sun & Moon Black Star Promo",
    ],
  },
  {
    era: "XY",
    names: [
      "Evolutions",
      "McDonald's Promos 2016",
      "Steam Siege",
      "Fates Collide",
      "Generations",
      "Generations Radiant Collection",
      "BREAKpoint",
      "McDonald's Promos 2015",
      "BREAKthrough",
      "Ancient Origins",
      "Roaring Skies",
      "Double Crisis",
      "Primal Clash",
      "Phantom Forces",
      "Furious Fists",
      "Alternate Art Promos",
      "McDonald's Promos 2014",
      "Flashfire",
      "XY Base",
      "XY Black Star Promos",
    ],
  },
  {
    era: "Black & White",
    names: [
      "Legendary Treasures",
      "Legendary Treasures Radiant Collection",
      "Plasma Blast",
      "Plasma Freeze",
      "Plasma Storm",
      "Dragon Vault",
      "Boundaries Crossed",
      "Dragons Exalted",
      "McDonald's Promos 2012",
      "Dark Explorers",
      "Next Destinies",
      "Noble Victories",
      "Emerging Powers",
      "McDonald's Promos 2011",
      "Black and White",
      "Black and White Promos",
    ],
  },
  {
    era: "Call of Legends",
    names: ["Call of Legends"],
  },
  {
    era: "HeartGold SoulSilver",
    names: [
      "Triumphant",
      "Undaunted",
      "Unleashed",
      "HeartGold SoulSilver",
      "HGSS Black Star Promo",
      "Miscellaneous Promos",
    ],
  },
  {
    era: "Platinum",
    names: ["Pokemon Rumble", "Arceus", "Supreme Victors", "Rising Rivals", "Pop Series 9", "Platinum"],
  },
  {
    era: "Diamond & Pearl",
    names: [
      "Stormfront",
      "Pop Series 8",
      "Legends Awakened",
      "Majestic Dawn",
      "Pop Series 7",
      "Great Encounters",
      "Secret Wonders",
      "Pop Series 6",
      "Mysterious Treasures",
      "Diamond & Pearl",
      "Diamond and Pearl Promo",
    ],
  },
  {
    era: "EX Ruby & Sapphire",
    names: [
      "Pop Series 5",
      "Power Keepers",
      "Dragon Frontiers",
      "Pop Series 4",
      "Crystal Guardians",
      "Holon Phantoms",
      "Pop Series 3",
      "Legend Maker",
      "Delta Species",
      "Unseen Forces",
      "Pop Series 2",
      "Emerald",
      "Deoxys",
      "Team Rocket Returns",
      "Pop Series 1",
      "Fire Red Leaf Green",
      "Hidden Legends",
      "Team Magma vs Team Aqua",
      "Nintendo Black Star Promo",
      "Sandstorm",
      "Dragon",
      "Ruby and Sapphire",
    ],
  },
  {
    era: "e-Card",
    names: ["Skyridge", "Aquapolis", "Expedition"],
  },
  {
    era: "Legendary Collection",
    names: ["Legendary Collection"],
  },
  {
    era: "Neo",
    names: [
      "Neo Destiny",
      "Neo Revelation",
      "Southern Islands",
      "Neo Discovery",
      "Neo Genesis",
    ],
  },
  {
    era: "Gym",
    names: ["Gym Challenge", "Gym Heroes"],
  },
  {
    era: "Base",
    names: [
      "Team Rocket",
      "Base Set 2",
      "Fossil",
      "WOTC Promo",
      "Jungle",
      "Base Set Unlimited",
      "Base Set Shadowless",
      "Base Set",
    ],
  },
];

const japaneseDefinitions: EraDefinition[] = [
  {
    era: "Scarlet & Violet",
    names: [
      "White Flare",
      "Black Bolt",
      "Night Wanderer",
      "Surging Sparks",
      "Stellar Crown",
      "Cyber Judge",
      "Wild Force",
      "Ancient Roar",
      "Future Flash",
      "Raging Surf",
      "Snow Hazard",
      "Clay Burst",
      "Triplet Beat",
      "Scarlet & Violet ex Starter Set",
      "Scarlet ex",
      "Violet ex",
      "Pokemon Card 151 (JP)",
      "Pokemon Card Gym Promo SV Series",
    ],
  },
  {
    era: "Sword & Shield",
    names: [
      "VSTAR Universe",
      "Paradigm Trigger",
      "Incandescent Arcana",
      "Lost Abyss",
      "Dark Phantasma",
      "Battle Region",
      "Star Birth",
      "Vmax Climax",
      "Fusion Arts",
      "Blue Sky Stream",
      "Skyscraping Perfect",
      "Eevee Heroes",
      "Silver Lance",
      "Jet-Black Spirit",
      "Matchless Fighters",
      "Single Strike Master",
      "Rapid Strike Master",
      "Shiny Star V",
      "Legendary Heartbeat",
      "Infinity Zone",
      "Explosive Walker",
      "Rebel Clash (JP: Rebellion Crash)",
      "Vmax Rising",
      "Sword",
      "Shield",
      "Pokemon Card Gym Promo S Series",
    ],
  },
  {
    era: "Sun & Moon",
    names: [
      "Dream League",
      "Alter Genesis",
      "Remix Bout",
      "Miracle Twins",
      "Sky Legend",
      "Double Blaze",
      "Full Metal Wall",
      "Night Unison",
      "Tag Team GX All Stars",
      "Ultra Shiny GX",
      "Hidden Fates (JP: GX Ultra Shiny Mini Sets)",
      "SM12a Tag All Stars",
      "Pokemon Card Gym Promo SM Series",
    ],
  },
  {
    era: "XY",
    names: [
      "Premium Champion Pack",
      "The Best of XY",
      "Battle Festa 2015",
      "Rage of the Broken Sky",
      "Blue Shock",
      "Red Flash",
      "Emerald Break",
      "Gaia Volcano",
      "Rising Fist",
      "Wild Blaze",
      "Bandit Ring",
      "Collection X",
      "Collection Y",
      "XY-P Promo",
    ],
  },
  {
    era: "Black & White",
    names: [
      "Legendary Treasures (JP: EX Battle Boost)",
      "Shiny Collection",
      "Mega Lillie's Pokémon",
      "Plasma Gale",
      "Plasma Storm",
      "Plasma Blast",
      "Cold Flare",
      "Dark Rush",
      "Dragon Blade",
      "Dragon Blast",
      "PokeKyun Collection",
      "BW-P Promo",
    ],
  },
  {
    era: "Diamond & Pearl",
    names: [
      "DPt-P Promo",
      "Lost Link",
      "SoulSilver Collection",
      "HeartGold Collection",
      "Intense Fight in the Destroyed Sky",
      "Galactic's Conquest",
      "Temple of Anger",
      "Cry from the Mysterious",
      "Awakening Legends",
      "DPBP# Series",
    ],
  },
  {
    era: "e-Card",
    names: [
      "Expansion Pack",
      "Pokedex Cards",
      "Mysterious Mountains",
      "Wind from the Sea",
      "Split Earth",
      "Town on No Map",
      "Eevee Heroes (JP: Eevee Heroes Premium)",
      "Vending Card Series",
    ],
  },
  {
    era: "Neo",
    names: ["Neo Genesis (JP)", "Neo Discovery (JP)", "Neo Revelation (JP)", "Neo Destiny (JP)"],
  },
  {
    era: "Gym",
    names: ["Gym Heroes (JP)", "Gym Challenge (JP)"],
  },
  {
    era: "Base",
    names: [
      "Expansion Pack (Base Set JP)",
      "Jungle (JP)",
      "Fossil (JP)",
      "Team Rocket (JP)",
      "Rocket Gang",
      "Intro Pack Neo",
    ],
  },
];

function buildSets(language: PokemonSetLanguage, definitions: EraDefinition[]): PokemonSet[] {
  return definitions.flatMap(({ era, names }) =>
    names.map((name) => ({
      slug: slugify(`${language}-${name}`),
      name,
      era,
      language,
      releaseYear: inferReleaseYear(language, era, name),
    })),
  );
}

export const pokemonEnglishSets: PokemonSet[] = buildSets("english", englishDefinitions);

export const pokemonJapaneseSets: PokemonSet[] = buildSets("japanese", japaneseDefinitions);

export const allPokemonSets: PokemonSet[] = [...pokemonEnglishSets, ...pokemonJapaneseSets];

export function findSetBySlug(slug: string): PokemonSet | undefined {
  return allPokemonSets.find((set) => set.slug === slug);
}

