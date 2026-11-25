import { createClient } from '@supabase/supabase-js';

// Resolve credentials from Vite environment variables or localStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('civisense_supabase_url');
  const localKey = localStorage.getItem('civisense_supabase_key');

  const url = (envUrl && envUrl.startsWith('http') && !envUrl.includes('placeholder'))
    ? envUrl.trim()
    : (localUrl?.trim() || null);

  const key = (envKey && envKey.length > 20 && !envKey.includes('placeholder'))
    ? envKey.trim()
    : (localKey?.trim() || null);

  return { url, key };
}

export function saveSupabaseCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('civisense_supabase_url', url.trim());
    localStorage.setItem('civisense_supabase_key', key.trim());
    _cachedClient = null; // reset cached client
    return true;
  }
  return false;
}

export function clearSupabaseCredentials() {
  localStorage.removeItem('civisense_supabase_url');
  localStorage.removeItem('civisense_supabase_key');
  _cachedClient = null;
}

let _cachedClient = null;

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export function getSupabaseClient() {
  if (_cachedClient) return _cachedClient;
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      _cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage
        }
      });
      return _cachedClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

// 40m Haversine distance formula (in meters)
export function calculateHaversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ==========================================================================
   Supabase Authentication API (Login, Signup, Admin & Citizen Roles)
   ========================================================================== */

export async function supabaseSignUp({ email, password, fullName, role = 'citizen' }) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please provide Supabase URL and Anon Key.');
  }

  // 1. Sign up user with custom metadata role
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0],
        role: role // 'admin' | 'citizen'
      }
    }
  });

  if (error) {
    if (error.code === '42501') {
      console.warn('⚠️ Supabase Permission Denied (42501): Run supabase/FIX_DATABASE_PERMISSIONS.sql in Supabase SQL editor.');
    }
    throw error;
  }

  // 2. Upsert profile record into 'profiles' table if user created
  if (data?.user) {
    try {
      await client.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || email.split('@')[0],
        role: role,
        updated_at: new Date().toISOString()
      });
    } catch (profileErr) {
      console.warn('Profile table upsert skipped:', profileErr);
    }
  }

  const userObj = {
    id: data.user?.id,
    name: fullName || email.split('@')[0],
    email: data.user?.email,
    role: role
  };

  return { user: userObj, session: data.session };
}

export async function supabaseSignIn({ email, password }) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please provide Supabase URL and Anon Key.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.code === '42501') {
      console.warn('⚠️ Supabase Permission Denied (42501): Run supabase/FIX_DATABASE_PERMISSIONS.sql in Supabase SQL editor.');
    }
    throw error;
  }

  let role = data.user?.user_metadata?.role || 'citizen';
  let fullName = data.user?.user_metadata?.full_name || email.split('@')[0];

  // Try fetching synced role from profiles table
  try {
    const { data: profile } = await client
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role) role = profile.role;
    if (profile?.full_name) fullName = profile.full_name;
  } catch {
    // default to user metadata
  }

  const userObj = {
    id: data.user.id,
    name: fullName,
    email: data.user.email,
    role: role
  };

  return { user: userObj, session: data.session };
}

export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
}

export async function supabaseGetSession() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;

    let role = session.user.user_metadata?.role || 'citizen';
    let fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];

    try {
      const { data: profile } = await client
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role) role = profile.role;
      if (profile?.full_name) fullName = profile.full_name;
    } catch {
      // fallback to metadata
    }

    return {
      id: session.user.id,
      name: fullName,
      email: session.user.email,
      role: role
    };
  } catch (err) {
    console.warn('Failed to retrieve Supabase session:', err);
    return null;
  }
}

/* ==========================================================================
   Supabase Database API (Reports, Deduplication, Status Updates)
   ========================================================================== */

export async function supabaseFetchReports() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42501') {
      console.warn('⚠️ Supabase Permission Denied (42501): Please run supabase/FIX_DATABASE_PERMISSIONS.sql in the Supabase SQL Editor to grant table privileges to the anon/authenticated role.');
    }
    console.error('Supabase fetch reports error:', error);
    throw error;
  }
  return data || [];
}

export async function supabaseCreateReport({ category, description, latitude, longitude, severity, photoFile, user }) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  // 1. Optional photo upload to Supabase Storage bucket 'issue-images'
  let imageUrl = null;
  if (photoFile) {
    try {
      const fileExt = photoFile.name ? photoFile.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadErr } = await client.storage
        .from('issue-images')
        .upload(fileName, photoFile, { cacheControl: '3600', upsert: false });

      if (!uploadErr && uploadData) {
        const { data: pubData } = client.storage.from('issue-images').getPublicUrl(fileName);
        imageUrl = pubData.publicUrl;
      }
    } catch (storageErr) {
      console.warn('Supabase storage upload note (bucket may not exist yet, continuing):', storageErr);
    }
  }

  // 2. Run 40m Haversine deduplication against existing active reports
  let duplicateParent = null;
  try {
    const { data: existingReports } = await client
      .from('reports')
      .select('id, category, latitude, longitude, status')
      .neq('status', 'resolved')
      .neq('status', 'rejected');

    if (existingReports && existingReports.length > 0) {
      for (const rep of existingReports) {
        if (rep.category === category) {
          const dist = calculateHaversineM(lat, lon, Number(rep.latitude), Number(rep.longitude));
          if (dist <= 40) {
            duplicateParent = rep;
            break;
          }
        }
      }
    }
  } catch (dedupErr) {
    console.warn('Deduplication check warning:', dedupErr);
  }

  // 3. Insert report into 'reports' table
  const newRecord = {
    category,
    description,
    latitude: lat,
    longitude: lon,
    severity: Number(severity),
    status: 'reported',
    image_url: imageUrl,
    duplicate_of: duplicateParent ? duplicateParent.id : null,
    user_id: user?.id || null,
    user_email: user?.email || null,
    user_role: user?.role || 'citizen',
    created_at: new Date().toISOString()
  };

  const { data: inserted, error: insertError } = await client
    .from('reports')
    .insert([newRecord])
    .select();

  if (insertError) {
    if (insertError.code === '42501') {
      console.warn('⚠️ Supabase Permission Denied (42501): Run supabase/FIX_DATABASE_PERMISSIONS.sql in Supabase SQL editor.');
    }
    throw insertError;
  }

  return {
    report: inserted?.[0] || newRecord,
    duplicateWarning: Boolean(duplicateParent),
    duplicateOf: duplicateParent?.id || null
  };
}

export async function supabaseUpdateReportStatus(id, newStatus) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await client
    .from('reports')
    .update({ status: newStatus })
    .eq('id', id)
    .select();

  if (error) {
    if (error.code === '42501') {
      console.warn('⚠️ Supabase Permission Denied (42501): Run supabase/FIX_DATABASE_PERMISSIONS.sql in Supabase SQL editor.');
    }
    throw error;
  }
  return data?.[0];
}

// Real-time listener for live GIS map & ticket status updates
export function supabaseSubscribeReports(onInsert, onUpdate, onDelete) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channelId = `reports-channel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = client
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reports' },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'reports' },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'reports' },
      (payload) => {
        if (onDelete) onDelete(payload.old);
      }
    )
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch (err) {
      console.warn('Realtime channel remove warning:', err);
    }
  };
}
