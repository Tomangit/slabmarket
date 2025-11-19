import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Slab ID is required" });
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
    // Get slab using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: slab, error: slabError } = await supabaseAdmin
      .from("slabs")
      .select(`
        *,
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("id", id)
      .single();

    if (slabError) {
      console.error("Error fetching slab:", slabError);
      return res.status(500).json({ 
        error: "Failed to fetch slab",
        details: slabError.message 
      });
    }

    if (!slab) {
      return res.status(404).json({ 
        error: "Slab not found"
      });
    }

    return res.status(200).json({ 
      success: true, 
      slab 
    });
  } catch (error) {
    console.error("Error in get-slab:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

