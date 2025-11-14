// Supabase Edge Function: Verify Certificate
// Stub implementation for PSA, BGS, CGC certificate verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  grading_company: string;
  certificate_number: string;
  grade?: string;
}

interface VerifyResponse {
  verified: boolean;
  valid: boolean;
  data?: {
    certificate_number: string;
    grade: string;
    card_name?: string;
    set_name?: string;
    grading_date?: string;
    pop_report?: {
      grade: string;
      population: number;
    };
  };
  error?: string;
}

// Stub verification logic - simulates API calls to grading companies
async function verifyCertificate(
  company: string,
  certNumber: string,
  grade?: string
): Promise<VerifyResponse> {
  // Normalize company name
  const normalizedCompany = company.toLowerCase().trim();

  // Stub validation - in production, this would call actual grading company APIs
  // PSA: https://www.psacard.com/cert/
  // BGS: https://www.beckett.com/grading/card-lookup
  // CGC: https://www.cgccards.com/certlookup/

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Basic validation - check format
  if (!certNumber || certNumber.length < 4) {
    return {
      verified: false,
      valid: false,
      error: "Invalid certificate number format",
    };
  }

  // Stub responses based on company
  switch (normalizedCompany) {
    case "psa":
    case "psa grading":
      // PSA format: typically 8-10 digits
      if (!/^\d{8,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "PSA certificate number must be 8-10 digits",
        };
      }
      // Stub: simulate successful verification
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "10",
          grading_date: new Date().toISOString().split("T")[0],
          pop_report: {
            grade: grade || "10",
            population: Math.floor(Math.random() * 1000) + 1,
          },
        },
      };

    case "bgs":
    case "beckett":
    case "bgs / beckett":
      // BGS format: typically alphanumeric or numeric
      if (!/^[A-Z0-9]{6,12}$/i.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "BGS certificate number format invalid",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "9.5",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    case "cgc":
    case "cgc cards":
      // CGC format: typically numeric
      if (!/^\d{6,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "CGC certificate number must be 6-10 digits",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "10",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    case "sgc":
    case "sgc grading":
      // SGC format: typically numeric
      if (!/^\d{6,10}$/.test(certNumber)) {
        return {
          verified: false,
          valid: false,
          error: "SGC certificate number format invalid",
        };
      }
      return {
        verified: true,
        valid: true,
        data: {
          certificate_number: certNumber,
          grade: grade || "10",
          grading_date: new Date().toISOString().split("T")[0],
        },
      };

    default:
      return {
        verified: false,
        valid: false,
        error: `Unsupported grading company: ${company}`,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: VerifyRequest = await req.json();
    const { grading_company, certificate_number, grade } = body;

    if (!grading_company || !certificate_number) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: grading_company, certificate_number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify certificate
    const result = await verifyCertificate(
      grading_company,
      certificate_number,
      grade
    );

    // Log verification attempt (optional - for analytics)
    if (result.verified) {
      await supabase.from("certificate_verifications").insert({
        user_id: user.id,
        grading_company: grading_company.toLowerCase(),
        certificate_number: certificate_number,
        verified: true,
        verified_at: new Date().toISOString(),
      }).catch((err) => {
        // Log table might not exist yet - that's okay for stub
        console.error("Failed to log verification:", err);
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in verify-certificate function:", error);
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

