import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type Data = {
  exists: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ exists: false, error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ exists: false, error: "Email is required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      exists: false, 
      error: "Server configuration error" 
    });
  }

  try {
    // Use Admin API to check if user exists
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists by listing users with the specific email
    // We use listUsers with a filter to check for the email
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error("Error checking user existence:", error);
      return res.status(500).json({ 
        exists: false, 
        error: "Failed to check user existence" 
      });
    }

    // Check if any user has this email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const userExists = data.users.some(
      (user) => user.email?.toLowerCase().trim() === normalizedEmail
    );

    return res.status(200).json({ exists: userExists });
  } catch (error) {
    console.error("Error in check-user-exists:", error);
    return res.status(500).json({ 
      exists: false, 
      error: "Internal server error" 
    });
  }
}

