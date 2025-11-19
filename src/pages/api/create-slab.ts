import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
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
    // Get user from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Verify that seller_id matches authenticated user
    const slabData = req.body;
    if (slabData.seller_id !== user.id) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "seller_id must match authenticated user" 
      });
    }

    // Create slab using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: slab, error: slabError } = await supabaseAdmin
      .from("slabs")
      .insert(slabData)
      .select()
      .single();

    if (slabError) {
      console.error("Error creating slab:", slabError);
      return res.status(500).json({ 
        error: "Failed to create slab",
        details: slabError.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      slab 
    });
  } catch (error) {
    console.error("Error in create-slab:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

