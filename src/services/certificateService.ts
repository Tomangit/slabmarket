// Certificate verification service
// Calls Supabase Edge Function to verify grading certificates

import { supabase } from "@/integrations/supabase/client";

export interface CertificateVerificationRequest {
  grading_company: string;
  certificate_number: string;
  grade?: string;
}

export interface CertificateVerificationResponse {
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

export const certificateService = {
  /**
   * Verify a grading certificate using Supabase Edge Function
   * @param request Certificate verification request
   * @returns Verification response
   */
  async verifyCertificate(
    request: CertificateVerificationRequest
  ): Promise<CertificateVerificationResponse> {
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Authentication required");
      }

      // Get Supabase URL - use the same URL as in client.ts
      const supabaseUrl = "https://xxsnsomathouvuhtshyw.supabase.co";

      // Call Edge Function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-certificate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to verify certificate",
        }));
        throw new Error(errorData.error || "Failed to verify certificate");
      }

      const data: CertificateVerificationResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Certificate verification error:", error);
      return {
        verified: false,
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during verification",
      };
    }
  },

  /**
   * Verify certificate and return simplified result
   * @param gradingCompany Grading company name (PSA, BGS, CGC, etc.)
   * @param certificateNumber Certificate number
   * @param grade Optional grade to verify
   * @returns true if verified and valid, false otherwise
   */
  async verify(
    gradingCompany: string,
    certificateNumber: string,
    grade?: string
  ): Promise<boolean> {
    const result = await this.verifyCertificate({
      grading_company: gradingCompany,
      certificate_number: certificateNumber,
      grade,
    });

    return result.verified && result.valid;
  },
};

