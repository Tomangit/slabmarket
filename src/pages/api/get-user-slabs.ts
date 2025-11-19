import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { user_id, status } = req.query;

  if (!user_id || typeof user_id !== "string") {
    return res.status(400).json({ error: "User ID is required" });
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
    console.log("[get-user-slabs] Fetching slabs for user_id:", user_id);
    
    // Verify JWT if provided (optional, but good for logging)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && user && user.id !== user_id) {
        console.warn("[get-user-slabs] JWT user ID doesn't match requested user_id. Continuing with service role...");
      }
    }
    
    // Get user slabs using service role (bypasses RLS)
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
        category:categories(id, name, slug),
        grading_company:grading_companies(id, name, code),
        seller:profiles(id, full_name, avatar_url, email)
      `)
      .eq("seller_id", user_id)
      .order("created_at", { ascending: false });

    if (status && typeof status === "string") {
      query = query.eq("status", status);
    }

    const { data: slabs, error: slabsError } = await query;

    console.log("[get-user-slabs] Query result:", {
      user_id,
      hasError: !!slabsError,
      errorMessage: slabsError?.message,
      slabsCount: slabs?.length || 0
    });

    if (slabsError) {
      console.error("[get-user-slabs] Error fetching user slabs:", slabsError);
      return res.status(500).json({ 
        error: "Failed to fetch user slabs",
        details: slabsError.message 
      });
    }

    console.log("[get-user-slabs] Returning slabs:", {
      user_id,
      count: slabs?.length || 0,
      slabIds: slabs?.map(s => s.id)
    });

    return res.status(200).json({ 
      success: true, 
      slabs: slabs || []
    });
  } catch (error) {
    console.error("Error in get-user-slabs:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

