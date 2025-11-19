#!/usr/bin/env node

/**
 * Normalize set names globally and remove variant duplicates from DB.
 * - Strip variant suffixes: Shadowless / Unlimited / 1st Edition / First Edition
 * - Collapse duplicates keeping a single canonical row per (language, name)
 *   Prefer the one with the earliest release_year, otherwise lowest lexicographic id.
 *
 * Safe for current schema because cards reference sets via set_name, not foreign key to sets.id.
 */

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function stripVariantSuffix(name) {
  if (!name) return name;
  return name.replace(/\s+(shadowless|unlimited|1st edition|first edition)$/i, "");
}

async function loadAllSets() {
  const { data, error } = await supabase
    .from("sets")
    .select("id, name, language, release_year");
  if (error) throw new Error(`Failed to load sets: ${error.message}`);
  return data || [];
}

async function updateSetName(id, newName) {
  const { error } = await supabase
    .from("sets")
    .update({ name: newName })
    .eq("id", id);
  if (error) throw new Error(`Failed to update set name (${id}): ${error.message}`);
}

async function deleteSetById(id) {
  const { error } = await supabase
    .from("sets")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete duplicate set (${id}): ${error.message}`);
}

async function main() {
  console.log("=== Normalizing set names and removing variant duplicates ===");
  const sets = await loadAllSets();
  console.log(`Loaded ${sets.length} sets`);

  // 1) Normalize names
  let renamed = 0;
  for (const s of sets) {
    const normalized = stripVariantSuffix(s.name);
    if (normalized !== s.name) {
      await updateSetName(s.id, normalized);
      renamed++;
    }
  }
  console.log(`Normalized names for ${renamed} sets`);

  // Reload after renames
  const updated = await loadAllSets();

  // 2) Collapse duplicates per (language, name)
  const groups = new Map();
  for (const s of updated) {
    const key = `${s.language}||${s.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  let deleted = 0;
  for (const [key, list] of groups.entries()) {
    if (list.length <= 1) continue;
    // pick canonical: earliest release_year, then lowest id
    const canonical = list
      .slice()
      .sort((a, b) => {
        const ay = a.release_year ?? 99999;
        const by = b.release_year ?? 99999;
        if (ay !== by) return ay - by;
        return String(a.id).localeCompare(String(b.id));
      })[0];
    for (const s of list) {
      if (s.id !== canonical.id) {
        await deleteSetById(s.id);
        deleted++;
      }
    }
  }
  console.log(`Deleted ${deleted} duplicate variant rows`);

  console.log("Done. Refresh the UI dropdown – variant rows should be gone.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


