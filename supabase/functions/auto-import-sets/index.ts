// Supabase Edge Function: Auto Import Sets
// Automatically checks for new sets in Pokemon TCG API and imports them
// Should be scheduled to run daily/weekly

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://api.pokemontcg.io/v2";
const PAGE_SIZE = 250;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify this is a cron request
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get language from query params (default: english)
    const url = new URL(req.url);
    const language = url.searchParams.get("language") || "english";

    console.log(`Starting auto-import for ${language} sets...`);

    // Fetch sets from Pokemon TCG API
    const apiSets = await fetchSetsFromAPI(language);
    
    if (!apiSets || apiSets.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No sets found in API",
          imported: 0,
          skipped: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${apiSets.length} sets in API`);

    // Get existing sets from database
    const { data: existingSets, error: fetchError } = await supabase
      .from("sets")
      .select("id, name")
      .eq("language", language);

    if (fetchError) {
      throw new Error(`Failed to fetch existing sets: ${fetchError.message}`);
    }

    const existingSetIds = new Set((existingSets || []).map(s => s.id));
    console.log(`Found ${existingSetIds.size} existing sets in database`);

    // Filter out sets that already exist
    const newSets = apiSets.filter(set => !existingSetIds.has(set.id));

    if (newSets.length === 0) {
      return new Response(
        JSON.stringify({
          message: "All sets already imported",
          imported: 0,
          skipped: apiSets.length,
          total: apiSets.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${newSets.length} new sets to import`);

    // Insert new sets in chunks
    const chunkSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < newSets.length; i += chunkSize) {
      const chunk = newSets.slice(i, i + chunkSize);
      
      const { error: insertError } = await supabase
        .from("sets")
        .upsert(chunk, { onConflict: "id" });

      if (insertError) {
        console.error(`Error inserting chunk ${i / chunkSize + 1}:`, insertError);
        errors += chunk.length;
      } else {
        imported += chunk.length;
        console.log(`Imported chunk ${i / chunkSize + 1} (${chunk.length} sets)`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Auto-import completed",
        imported,
        skipped: apiSets.length - newSets.length,
        errors,
        total: apiSets.length,
        newSets: newSets.map(s => ({ id: s.id, name: s.name })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in auto-import-sets function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function fetchSetsFromAPI(language: string): Promise<any[]> {
  let page = 1;
  const sets = [];
  const REQUEST_TIMEOUT = 60000; // 60 seconds

  while (true) {
    const params = new URLSearchParams({ 
      page: String(page), 
      pageSize: String(PAGE_SIZE) 
    });
    
    if (language === "english") {
      // For English, we typically don't need a filter
      // But API might return all languages, so we'll filter after
    } else {
      params.append("q", `series:${language}`);
    }

    const url = `${API_BASE}/sets?${params.toString()}`;
    
    const headers: Record<string, string> = {
      "User-Agent": "SlabMarket-AutoImport/1.0",
    };
    
    const pokemonApiKey = Deno.env.get("POKEMON_TCG_API_KEY");
    if (pokemonApiKey) {
      headers["X-Api-Key"] = pokemonApiKey;
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
        }, REQUEST_TIMEOUT);
      });

      const fetchPromise = fetch(url, { headers });
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      const batch = json.data ?? [];

      if (batch.length === 0) {
        break;
      }

      // Map API sets to our database format
      const mappedSets = batch
        .filter((set: any) => {
          // Filter by language if needed (API might return mixed)
          // For now, we'll import all and let the database handle duplicates
          return true;
        })
        .map((set: any) => ({
          id: set.id,
          name: set.name,
          era: set.series || "Unknown",
          language: language,
          release_year: set.releaseDate ? Number(set.releaseDate.slice(0, 4)) : null,
        }));

      sets.push(...mappedSets);

      if (batch.length < PAGE_SIZE) {
        break;
      }

      page += 1;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      // Continue with what we have
      break;
    }
  }

  return sets;
}

