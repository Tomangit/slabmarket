
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export const categoryService = {
  async getAllCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("enabled", true)
      .order("name");

    if (error) throw error;
    return data;
  },

  async getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("enabled", true)
      .single();

    if (error) throw error;
    return data;
  }
};
