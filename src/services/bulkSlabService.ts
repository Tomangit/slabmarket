import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { setService } from "./setService";
import { cardService } from "./cardService";

type Slab = Database["public"]["Tables"]["slabs"]["Row"];
type SlabInsert = Database["public"]["Tables"]["slabs"]["Insert"];

export interface BulkSlabRow {
  cert_number: string;
  grade: string;
  grading_company: string; // PSA, BGS, CGC, SGC, ACE
  name: string;
  set_name: string;
  card_number?: string;
  year?: number;
  price: number;
  description?: string;
  listing_type?: string; // bin, auction, featured
  status?: string; // active, sold, pending
  first_edition?: boolean;
  shadowless?: boolean;
  pokemon_center_edition?: boolean;
  prerelease?: boolean;
  staff?: boolean;
  tournament_card?: boolean;
  error_card?: boolean;
  subgrade_centering?: number;
  subgrade_corners?: number;
  subgrade_edges?: number;
  subgrade_surface?: number;
  shipping_insured?: boolean;
  shipping_temperature_controlled?: boolean;
  shipping_cost?: number;
  shipping_estimated_days?: number;
  escrow_protection?: boolean;
  buyer_protection?: boolean;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export const bulkSlabService = {
  /**
   * Export user's slabs to CSV format
   */
  async exportToCSV(userId: string): Promise<string> {
    const { data: slabs, error } = await supabase
      .from("slabs")
      .select(`
        *,
        grading_company:grading_companies(code)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!slabs || slabs.length === 0) {
      return this.getCSVHeader();
    }

    // Build CSV
    let csv = this.getCSVHeader() + "\n";

    for (const slab of slabs) {
      const row = [
        slab.cert_number || "",
        slab.grade || "",
        slab.grading_company?.code?.toUpperCase() || "",
        slab.name || "",
        slab.set_name || "",
        slab.card_number || "",
        slab.year?.toString() || "",
        slab.price?.toString() || "0",
        (slab.description || "").replace(/"/g, '""'), // Escape quotes
        slab.listing_type || "bin",
        slab.status || "active",
        slab.first_edition ? "true" : "false",
        slab.shadowless ? "true" : "false",
        slab.pokemon_center_edition ? "true" : "false",
        slab.prerelease ? "true" : "false",
        slab.staff ? "true" : "false",
        slab.tournament_card ? "true" : "false",
        slab.error_card ? "true" : "false",
        slab.subgrade_centering?.toString() || "",
        slab.subgrade_corners?.toString() || "",
        slab.subgrade_edges?.toString() || "",
        slab.subgrade_surface?.toString() || "",
        slab.shipping_insured ? "true" : "false",
        slab.shipping_temperature_controlled ? "true" : "false",
        slab.shipping_cost?.toString() || "",
        slab.shipping_estimated_days?.toString() || "",
        slab.escrow_protection ? "true" : "false",
        slab.buyer_protection ? "true" : "false",
      ];

      // Wrap fields in quotes and join
      csv += row.map(field => `"${field}"`).join(",") + "\n";
    }

    return csv;
  },

  /**
   * Get CSV header row
   */
  getCSVHeader(): string {
    const headers = [
      "cert_number",
      "grade",
      "grading_company",
      "name",
      "set_name",
      "card_number",
      "year",
      "price",
      "description",
      "listing_type",
      "status",
      "first_edition",
      "shadowless",
      "pokemon_center_edition",
      "prerelease",
      "staff",
      "tournament_card",
      "error_card",
      "subgrade_centering",
      "subgrade_corners",
      "subgrade_edges",
      "subgrade_surface",
      "shipping_insured",
      "shipping_temperature_controlled",
      "shipping_cost",
      "shipping_estimated_days",
      "escrow_protection",
      "buyer_protection",
    ];
    return headers.join(",");
  },

  /**
   * Parse CSV content to array of rows
   */
  parseCSV(csvContent: string): BulkSlabRow[] {
    const lines = csvContent.split("\n").filter(line => line.trim());
    if (lines.length === 0) return [];

    // Skip header row
    const dataLines = lines.slice(1);
    const rows: BulkSlabRow[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const fields = this.parseCSVLine(line);
      if (fields.length < 4) continue; // Skip invalid rows

      const row: BulkSlabRow = {
        cert_number: fields[0]?.trim() || "",
        grade: fields[1]?.trim() || "",
        grading_company: fields[2]?.trim().toUpperCase() || "",
        name: fields[3]?.trim() || "",
        set_name: fields[4]?.trim() || "",
        card_number: fields[5]?.trim() || undefined,
        year: fields[6] ? parseInt(fields[6]) : undefined,
        price: fields[7] ? parseFloat(fields[7]) : 0,
        description: fields[8]?.trim() || undefined,
        listing_type: fields[9]?.trim() || "bin",
        status: fields[10]?.trim() || "active",
        first_edition: fields[11]?.toLowerCase() === "true",
        shadowless: fields[12]?.toLowerCase() === "true",
        pokemon_center_edition: fields[13]?.toLowerCase() === "true",
        prerelease: fields[14]?.toLowerCase() === "true",
        staff: fields[15]?.toLowerCase() === "true",
        tournament_card: fields[16]?.toLowerCase() === "true",
        error_card: fields[17]?.toLowerCase() === "true",
        subgrade_centering: fields[18] ? parseFloat(fields[18]) : undefined,
        subgrade_corners: fields[19] ? parseFloat(fields[19]) : undefined,
        subgrade_edges: fields[20] ? parseFloat(fields[20]) : undefined,
        subgrade_surface: fields[21] ? parseFloat(fields[21]) : undefined,
        shipping_insured: fields[22]?.toLowerCase() === "true",
        shipping_temperature_controlled: fields[23]?.toLowerCase() === "true",
        shipping_cost: fields[24] ? parseFloat(fields[24]) : undefined,
        shipping_estimated_days: fields[25] ? parseInt(fields[25]) : undefined,
        escrow_protection: fields[26]?.toLowerCase() !== "false", // Default true
        buyer_protection: fields[27]?.toLowerCase() !== "false", // Default true
      };

      rows.push(row);
    }

    return rows;
  },

  /**
   * Parse a single CSV line, handling quoted fields
   */
  parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        // End of field
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // Add last field
    fields.push(currentField);

    return fields;
  },

  /**
   * Validate a bulk slab row
   */
  validateRow(row: BulkSlabRow, rowIndex: number): { valid: boolean; error?: string } {
    if (!row.cert_number || row.cert_number.trim() === "") {
      return { valid: false, error: `Row ${rowIndex + 1}: Certificate number is required` };
    }

    if (!row.grade || row.grade.trim() === "") {
      return { valid: false, error: `Row ${rowIndex + 1}: Grade is required` };
    }

    if (!row.grading_company || !["PSA", "BGS", "CGC", "SGC", "ACE"].includes(row.grading_company.toUpperCase())) {
      return { valid: false, error: `Row ${rowIndex + 1}: Invalid grading company. Must be PSA, BGS, CGC, SGC, or ACE` };
    }

    if (!row.name || row.name.trim() === "") {
      return { valid: false, error: `Row ${rowIndex + 1}: Card name is required` };
    }

    if (!row.price || row.price <= 0) {
      return { valid: false, error: `Row ${rowIndex + 1}: Price must be greater than 0` };
    }

    if (row.listing_type && !["bin", "auction", "featured"].includes(row.listing_type)) {
      return { valid: false, error: `Row ${rowIndex + 1}: Invalid listing type. Must be bin, auction, or featured` };
    }

    if (row.status && !["active", "sold", "pending", "inactive"].includes(row.status)) {
      return { valid: false, error: `Row ${rowIndex + 1}: Invalid status. Must be active, sold, pending, or inactive` };
    }

    return { valid: true };
  },

  /**
   * Import slabs from CSV
   */
  async importFromCSV(csvContent: string, userId: string): Promise<BulkImportResult> {
    const rows = this.parseCSV(csvContent);
    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Get grading company IDs
    const { data: gradingCompanies } = await supabase
      .from("grading_companies")
      .select("id, code");

    const gradingCompanyMap: Record<string, string> = {};
    if (gradingCompanies) {
      for (const gc of gradingCompanies) {
        gradingCompanyMap[gc.code.toUpperCase()] = gc.id;
      }
    }

    // Get all sets for set name lookup
    const allSets = await setService.getAllSets();
    const setMap: Record<string, string> = {};
    for (const set of allSets) {
      setMap[set.name.toLowerCase()] = set.slug;
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Validate row
      const validation = this.validateRow(row, i);
      if (!validation.valid) {
        result.failed++;
        result.errors.push({ row: i + 2, error: validation.error || "Unknown error" });
        continue;
      }

      try {
        // Find set by name
        let cardId: string | null = null;
        if (row.set_name) {
          const setSlug = setMap[row.set_name.toLowerCase()];
          if (setSlug) {
            // Try to find card by name and set
            try {
              const cards = await cardService.getCardsBySet(setSlug);
              const matchingCard = cards.find(
                c => c.name.toLowerCase() === row.name.toLowerCase()
              );
              if (matchingCard) {
                cardId = matchingCard.id;
              }
            } catch (error) {
              // Card not found, continue without card_id
            }
          }
        }

        // Map grading company
        const gradingCompanyId = gradingCompanyMap[row.grading_company.toUpperCase()] || null;

        // Calculate shipping cost (simplified - you might want to use shippingService)
        const shippingCost = row.shipping_cost || (row.price < 100 ? 5 : row.price < 500 ? 15 : 25);

        // Create slab
        const slabData: SlabInsert = {
          cert_number: row.cert_number.trim(),
          grade: row.grade.trim(),
          grading_company_id: gradingCompanyId,
          name: row.name.trim(),
          set_name: row.set_name?.trim() || null,
          card_id: cardId,
          card_number: row.card_number?.trim() || null,
          year: row.year || null,
          price: row.price,
          description: row.description?.trim() || null,
          listing_type: row.listing_type || "bin",
          status: row.status || "active",
          seller_id: userId,
          currency: "USD",
          first_edition: row.first_edition || false,
          shadowless: row.shadowless || false,
          pokemon_center_edition: row.pokemon_center_edition || false,
          prerelease: row.prerelease || false,
          staff: row.staff || false,
          tournament_card: row.tournament_card || false,
          error_card: row.error_card || false,
          subgrade_centering: row.subgrade_centering || null,
          subgrade_corners: row.subgrade_corners || null,
          subgrade_edges: row.subgrade_edges || null,
          subgrade_surface: row.subgrade_surface || null,
          shipping_available: true,
          shipping_insured: row.shipping_insured !== false,
          shipping_temperature_controlled: row.shipping_temperature_controlled || false,
          shipping_cost: shippingCost,
          shipping_estimated_days: row.shipping_estimated_days || 7,
          escrow_protection: row.escrow_protection !== false,
          buyer_protection: row.buyer_protection !== false,
          views: 0,
          watchlist_count: 0,
        };

        const { error } = await supabase.from("slabs").insert(slabData);

        if (error) {
          result.failed++;
          result.errors.push({ row: i + 2, error: error.message });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  },

  /**
   * Parse CSV for price updates (cert_number, price format)
   */
  parsePriceUpdateCSV(csvContent: string): Array<{ cert_number: string; price: number }> {
    const lines = csvContent.split("\n").filter(line => line.trim());
    if (lines.length === 0) return [];

    // Skip header row if present
    const dataLines = lines.slice(1);
    const updates: Array<{ cert_number: string; price: number }> = [];

    for (const line of dataLines) {
      const fields = this.parseCSVLine(line);
      if (fields.length < 2) continue;

      const cert_number = fields[0]?.trim();
      const price = parseFloat(fields[1]);

      if (cert_number && !isNaN(price) && price > 0) {
        updates.push({ cert_number, price });
      }
    }

    return updates;
  },

  /**
   * Export price update template CSV
   */
  async exportPriceUpdateTemplate(userId: string): Promise<string> {
    const { data: slabs, error } = await supabase
      .from("slabs")
      .select("cert_number, price, name")
      .eq("seller_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!slabs || slabs.length === 0) {
      return "cert_number,price\n";
    }

    let csv = "cert_number,price\n";
    for (const slab of slabs) {
      csv += `"${slab.cert_number || ""}",${slab.price || 0}\n`;
    }

    return csv;
  },

  /**
   * Bulk update prices from CSV
   */
  async bulkUpdatePrices(updates: Array<{ cert_number: string; price: number }>, userId: string): Promise<{ success: number; failed: number; errors: Array<{ cert_number: string; error: string }> }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ cert_number: string; error: string }>,
    };

    for (const update of updates) {
      try {
        const { error } = await supabase
          .from("slabs")
          .update({ price: update.price })
          .eq("cert_number", update.cert_number)
          .eq("seller_id", userId);

        if (error) {
          result.failed++;
          result.errors.push({ cert_number: update.cert_number, error: error.message });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          cert_number: update.cert_number,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  },

  /**
   * Bulk update prices by percentage or fixed amount
   */
  async bulkUpdatePricesByRule(
    userId: string,
    rule: {
      type: "percentage" | "fixed";
      value: number;
      filter?: {
        status?: string;
        min_price?: number;
        max_price?: number;
        grading_company_id?: string;
      };
    }
  ): Promise<{ success: number; failed: number; errors: Array<{ cert_number: string; error: string }> }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ cert_number: string; error: string }>,
    };

    // Build query
    let query = supabase
      .from("slabs")
      .select("id, cert_number, price")
      .eq("seller_id", userId);

    if (rule.filter?.status) {
      query = query.eq("status", rule.filter.status);
    }
    if (rule.filter?.min_price) {
      query = query.gte("price", rule.filter.min_price);
    }
    if (rule.filter?.max_price) {
      query = query.lte("price", rule.filter.max_price);
    }
    if (rule.filter?.grading_company_id) {
      query = query.eq("grading_company_id", rule.filter.grading_company_id);
    }

    const { data: slabs, error: queryError } = await query;

    if (queryError) {
      result.errors.push({ cert_number: "all", error: queryError.message });
      return result;
    }

    if (!slabs || slabs.length === 0) {
      return result;
    }

    // Update each slab
    for (const slab of slabs) {
      try {
        let newPrice: number;
        if (rule.type === "percentage") {
          newPrice = Math.round((slab.price * (1 + rule.value / 100)) * 100) / 100;
        } else {
          newPrice = Math.round((slab.price + rule.value) * 100) / 100;
        }

        // Ensure price is positive
        if (newPrice <= 0) {
          result.failed++;
          result.errors.push({
            cert_number: slab.cert_number || "unknown",
            error: "New price would be zero or negative",
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from("slabs")
          .update({ price: newPrice })
          .eq("id", slab.id);

        if (updateError) {
          result.failed++;
          result.errors.push({
            cert_number: slab.cert_number || "unknown",
            error: updateError.message,
          });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          cert_number: slab.cert_number || "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  },
};

