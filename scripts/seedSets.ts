import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

import { allPokemonSets } from "../src/data/pokemonSetCatalog";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Please set them before running the seed script.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedSets() {
  const payload = allPokemonSets.map((set) => ({
    id: set.slug,
    name: set.name,
    era: set.era,
    language: set.language,
    release_year: set.releaseYear ?? null,
  }));

  const { error } = await supabase.from("sets").upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Failed to seed sets:", error);
    process.exit(1);
  }

  console.log(`Seeded ${payload.length} sets to Supabase`);
}

seedSets().then(() => {
  console.log("Done.");
  process.exit(0);
});

