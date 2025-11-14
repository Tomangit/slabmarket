
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type GradingCompany = Database["public"]["Tables"]["grading_companies"]["Row"];

export const gradingCompanyService = {
  async getAllGradingCompanies() {
    const { data, error } = await supabase
      .from("grading_companies")
      .select("*")
      .order("name");

    if (error) throw error;
    return data;
  },

  async getGradingCompanyByCode(code: string) {
    const { data, error } = await supabase
      .from("grading_companies")
      .select("*")
      .eq("code", code)
      .single();

    if (error) throw error;
    return data;
  },

  async verifyGradingCompany(code: string) {
    const { data, error } = await supabase
      .from("grading_companies")
      .select("verification_enabled, api_endpoint")
      .eq("code", code)
      .single();

    if (error) throw error;
    return data;
  }
};
