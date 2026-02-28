import { supabase } from './supabase';
import { compressImage } from './compress';

const PAGE_SIZE = 20;

/**
 * Fetch a single part by barcode. Returns null if not found.
 */
export async function getPartByBarcode(barcode) {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Sanitize search input for use in ilike queries.
 * Escapes Postgres wildcards and special chars.
 */
function sanitizeSearch(input) {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Fetch paginated parts list, newest first.
 * Returns { data, hasMore, total }
 */
export async function getParts({ page = 0, search = '' }) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('parts')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (search.trim()) {
    const safe = sanitizeSearch(search.trim());
    query = query.or(
      `barcode.ilike.%${safe}%,notes.ilike.%${safe}%,location.ilike.%${safe}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    hasMore: (from + PAGE_SIZE) < (count || 0),
    total: count || 0,
  };
}

/**
 * Create a new part entry.
 */
export async function createPart(part) {
  const { data, error } = await supabase
    .from('parts')
    .insert({
      barcode: part.barcode,
      quantity: part.quantity,
      notes: part.notes || null,
      location: part.location || null,
      photos: part.photos || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing part.
 */
export async function updatePart(id, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('parts')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * "Add more" to an existing part — increments quantity, appends photos.
 */
export async function addToPart(existingPart, { quantity, photos, notes, location }) {
  const merged = {
    quantity: existingPart.quantity + quantity,
    photos: [...(existingPart.photos || []), ...(photos || [])],
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined && notes !== null && notes !== '') {
    merged.notes = notes;
  }
  if (location !== undefined && location !== null && location !== '') {
    merged.location = location;
  }

  const { data, error } = await supabase
    .from('parts')
    .update(merged)
    .eq('id', existingPart.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a part by ID.
 */
export async function deletePart(id) {
  const { error } = await supabase.from('parts').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Upload a single photo to Supabase Storage.
 * Compresses the image first (max 1600px, 75% JPEG).
 * Returns the public URL.
 */
export async function uploadPhoto(barcode, file) {
  // Compress before upload
  const compressed = await compressImage(file);

  const fileName = `${barcode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from('part-photos')
    .upload(fileName, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('part-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Upload multiple photos. Compresses each one.
 * Returns array of public URLs.
 */
export async function uploadPhotos(barcode, files) {
  const urls = [];
  for (const file of files) {
    try {
      const url = await uploadPhoto(barcode, file);
      urls.push(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      // Continue uploading remaining photos
    }
  }
  return urls;
}
