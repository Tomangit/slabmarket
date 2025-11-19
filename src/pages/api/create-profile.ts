import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId, email, fullName } = req.body;

  if (!userId) {
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create profile using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email: email || null,
        full_name: fullName || null,
      }, {
        onConflict: "id"
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      return res.status(500).json({ 
        error: "Failed to create profile",
        details: profileError.message 
      });
    }

    // Create default wishlist if it doesn't exist
    try {
      // Check if default wishlist exists
      const { data: existingWishlist } = await supabaseAdmin
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .eq("is_default", true)
        .single();

      if (!existingWishlist) {
        // Create default wishlist
        const { error: wishlistError } = await supabaseAdmin
          .from("wishlists")
          .insert({
            user_id: userId,
            name: "My Wishlist",
            description: "Default wishlist",
            is_default: true,
          });

        if (wishlistError && wishlistError.code !== '23505') { // Ignore duplicate key errors
          console.error("Error creating default wishlist:", wishlistError);
        }
      }
    } catch (wishlistError) {
      console.error("Error creating default wishlist:", wishlistError);
      // Don't fail the request if wishlist creation fails
    }

    return res.status(200).json({ 
      success: true, 
      profile 
    });
  } catch (error) {
    console.error("Error in create-profile:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

