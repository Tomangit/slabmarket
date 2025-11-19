import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { card_id, grading_company_id, min_grade, max_price, languages, first_edition, shadowless, holo, reverse_holo, pokemon_center_edition, prerelease, staff, tournament_card, error_card } = req.query;

  if (!card_id || typeof card_id !== "string") {
    return res.status(400).json({ error: "Card ID is required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase environment variables not set.");
    return res.status(500).json({ 
      error: "Server configuration error" 
    });
  }

  try {
    console.log("[get-card-listings] Fetching listings for card_id:", card_id);
    
    // Get card listings using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let query = supabaseAdmin
      .from("slabs")
      .select(`
        *,
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("card_id", card_id)
      .eq("status", "active")
      .order("price", { ascending: true });

    if (grading_company_id && typeof grading_company_id === "string") {
      query = query.eq("grading_company_id", grading_company_id);
    }

    if (min_grade && typeof min_grade === "string") {
      query = query.gte("grade", min_grade);
    }

    if (max_price && typeof max_price === "string") {
      query = query.lte("price", parseFloat(max_price));
    }

    if (languages) {
      const langArray = Array.isArray(languages) ? languages : [languages];
      if (langArray.length > 0) {
        query = query.in("language", langArray);
      }
    }

    if (first_edition !== undefined) {
      query = query.eq("first_edition", first_edition === "true");
    }
    if (shadowless !== undefined) {
      query = query.eq("shadowless", shadowless === "true");
    }
    if (holo !== undefined) {
      query = query.eq("holo", holo === "true");
    }
    if (reverse_holo !== undefined) {
      query = query.eq("reverse_holo", reverse_holo === "true");
    }
    if (pokemon_center_edition !== undefined) {
      query = query.eq("pokemon_center_edition", pokemon_center_edition === "true");
    }
    if (prerelease !== undefined) {
      query = query.eq("prerelease", prerelease === "true");
    }
    if (staff !== undefined) {
      query = query.eq("staff", staff === "true");
    }
    if (tournament_card !== undefined) {
      query = query.eq("tournament_card", tournament_card === "true");
    }
    if (error_card !== undefined) {
      query = query.eq("error_card", error_card === "true");
    }

    const { data: listings, error: listingsError } = await query;

    console.log("[get-card-listings] Query result:", {
      card_id,
      hasError: !!listingsError,
      errorMessage: listingsError?.message,
      listingsCount: listings?.length || 0
    });

    if (listingsError) {
      console.error("[get-card-listings] Error fetching card listings:", listingsError);
      return res.status(500).json({ 
        error: "Failed to fetch card listings",
        details: listingsError.message 
      });
    }

    console.log("[get-card-listings] Returning listings:", {
      card_id,
      count: listings?.length || 0,
      listingIds: listings?.map(l => l.id)
    });

    return res.status(200).json({ 
      success: true, 
      listings: listings || []
    });
  } catch (error) {
    console.error("Error in get-card-listings:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

