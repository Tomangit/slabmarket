import { supabase } from "@/integrations/supabase/client";

export type VerifyCertificateResponse = {
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
};

export async function verifyCertificateViaEdge(params: {
  gradingCompany: string;
  certificateNumber: string;
  grade?: string;
}): Promise<VerifyCertificateResponse> {
  const { gradingCompany, certificateNumber, grade } = params;
  const { data, error } = await supabase.functions.invoke<VerifyCertificateResponse>(
    "verify-certificate",
    {
      body: {
        grading_company: gradingCompany,
        certificate_number: certificateNumber,
        grade,
      },
    },
  );
  if (error) {
    return { verified: false, valid: false, error: error.message };
  }
  return data as VerifyCertificateResponse;
}


