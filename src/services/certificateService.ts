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
    grading_company?: string;
    certificate_number: string;
    grade: string;
    card_name?: string;
    set_name?: string;
    card_number?: string;
    year?: number;
    set_slug?: string;
    image_url?: string;
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
      // Get current session to ensure token is available
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("[CertificateService] No active session:", sessionError);
        return {
          verified: false,
          valid: false,
          error: "You must be logged in to verify certificates",
        };
      }

      // Dev bypass wyłączony - używamy realnych danych z PSA przez Edge Function

      
      // Invoke via supabase-js - it should automatically add Authorization header with token
      let responseData: any = null;
      let responseError: any = null;
      
      try {
        const response = await (supabase as any).functions.invoke(
          "verify-certificate",
          { body: request }
        );
        responseData = response.data;
        responseError = response.error;
      } catch (err: any) {
        // If invoke throws, try to extract error details
        console.error("[CertificateService] Invoke threw error:", err);
        responseError = err;
        
        // Try to read error response body if available
        if (err?.context?.body && err.context.body instanceof Response) {
          try {
            const errorBody = await err.context.body.clone().json();
            console.error("[CertificateService] Error body:", errorBody);
            responseError = {
              ...err,
              parsedBody: errorBody,
            };
          } catch (e) {
            // If parsing fails, try text
            try {
              const errorText = await err.context.body.clone().text();
              console.error("[CertificateService] Error body (text):", errorText);
            } catch (e2) {
              // Ignore
            }
          }
        }
      }


      if (responseError) {
        const error = responseError;
        console.error("[CertificateService] Error from Edge Function:", error);
        console.error("[CertificateService] Error details:", {
          message: error.message,
          context: error.context,
          status: error.context?.status,
          statusText: error.context?.statusText,
          body: error.context?.body,
        });
        
        // Extract error message from error object
        let errorMessage = error.message || "Failed to verify certificate";
        
        // Try to read error response body from ReadableStream
        if (error.context?.body && error.context.body instanceof ReadableStream) {
          try {
            const reader = error.context.body.getReader();
            const { value, done } = await reader.read();
            if (!done && value) {
              const bodyText = new TextDecoder().decode(value);
              console.error("[CertificateService] Error body text:", bodyText);
              try {
                const errorBody = JSON.parse(bodyText);
                console.error("[CertificateService] Parsed error body:", errorBody);
                if (errorBody.error) {
                  errorMessage = errorBody.error;
                } else if (errorBody.message) {
                  errorMessage = errorBody.message;
                } else if (errorBody.details) {
                  errorMessage = `${errorBody.error || errorBody.message || "Server error"}: ${errorBody.details}`;
                }
              } catch (parseError) {
                // If parsing fails, use the text as error message
                if (bodyText && bodyText.trim().length > 0) {
                  errorMessage = bodyText.substring(0, 200); // Limit length
                }
              }
            }
          } catch (readError) {
            console.error("[CertificateService] Failed to read error body:", readError);
          }
        }
        
        // Try to use parsed body if available (fallback)
        if (error.parsedBody) {
          const errorBody = error.parsedBody;
          if (errorBody.error) {
            errorMessage = errorBody.error;
          } else if (errorBody.message) {
            errorMessage = errorBody.message;
          } else if (errorBody.details) {
            errorMessage = `${errorBody.error || errorBody.message || "Server error"}: ${errorBody.details}`;
          }
        }
        
        return {
          verified: false,
          valid: false,
          error: errorMessage,
        };
      }

      return (responseData ?? { verified: false, valid: false }) as CertificateVerificationResponse;
    } catch (error: any) {
      console.error("[CertificateService] Certificate verification error:", error);
      console.error("[CertificateService] Error details (catch):", {
        message: error?.message,
        context: error?.context,
        status: error?.context?.status,
        statusText: error?.context?.statusText,
        body: error?.context?.body,
        name: error?.name,
      });
      
      // Handle FunctionsHttpError specifically
      let errorMessage = "An unexpected error occurred during verification";
      
      // Try to extract error message from various places
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.context?.message) {
        errorMessage = error.context.message;
      } else if (error?.context?.body) {
        try {
          // If body is ReadableStream, read it first
          let bodyText = error.context.body;
          if (bodyText instanceof ReadableStream) {
            const reader = bodyText.getReader();
            const { value } = await reader.read();
            bodyText = new TextDecoder().decode(value);
          }
          
          const errorBody = typeof bodyText === 'string' 
            ? JSON.parse(bodyText) 
            : bodyText;
          if (errorBody.error) {
            errorMessage = errorBody.error;
          } else if (errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (e) {
          console.error("[CertificateService] Failed to parse error body (catch):", e);
          // If parsing fails, use the message as is
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      // Add status code if available
      if (error?.context?.status) {
        errorMessage += ` (Status: ${error.context.status})`;
      }
      
      return {
        verified: false,
        valid: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Verify certificate and return full parsed data for auto-fill
   */
  async verifyAndGetData(
    gradingCompany: string,
    certificateNumber: string,
    grade?: string
  ): Promise<CertificateVerificationResponse> {
    return this.verifyCertificate({
      grading_company: gradingCompany,
      certificate_number: certificateNumber,
      grade,
    });
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

