import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const authHeader = req.headers.authorization;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid slab ID' });
    }

    // Verify user is authenticated (optional - we can allow deletion if user has valid JWT)
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        console.log('[delete-slab] Auth verification failed:', authError?.message);
        // Still proceed - service role can delete, but log it
      } else {
        console.log('[delete-slab] Verified user:', user.id);
      }
    }

    // First, verify the slab exists and get seller_id
    const { data: existingSlab, error: fetchError } = await supabaseAdmin
      .from('slabs')
      .select('id, seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSlab) {
      console.error('[delete-slab] Error fetching slab:', fetchError);
      return res.status(404).json({ error: 'Slab not found' });
    }

    // If user is authenticated, verify they own the slab
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && user && existingSlab.seller_id !== user.id) {
        console.error('[delete-slab] User does not own this slab:', {
          userId: user.id,
          sellerId: existingSlab.seller_id,
        });
        return res.status(403).json({ error: 'You do not have permission to delete this slab' });
      }
    }

    // Delete the slab using service role (bypasses RLS)
    // Use .select() to verify that rows were actually deleted
    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from('slabs')
      .delete()
      .eq('id', id)
      .select();

    if (deleteError) {
      console.error('[delete-slab] Error deleting slab:', deleteError);
      return res.status(500).json({ error: 'Failed to delete slab', details: deleteError.message });
    }

    // Verify that a row was actually deleted
    if (!deletedRows || deletedRows.length === 0) {
      console.error('[delete-slab] No rows deleted for id:', id);
      return res.status(404).json({ error: 'Slab not found or already deleted', id });
    }

    console.log('[delete-slab] Successfully deleted slab:', id, 'Deleted rows:', deletedRows.length);
    return res.status(200).json({ success: true, id, deletedRows: deletedRows.length });
  } catch (error: any) {
    console.error('[delete-slab] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

