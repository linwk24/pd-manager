'use client';

import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';

export interface VaultEntry {
  id: string;
  title: string;
  username: string | null;
  password?: string;
  url: string | null;
  notes: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

async function getToken(): Promise<string> {
  // SQLite 模式：用 localStorage 的 token
  const localToken = localStorage.getItem('local_token');
  if (localToken) return localToken;

  // Supabase 模式：用 session token
  const supabase = await getSupabaseBrowserClientWithRetry();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('未登录');
  }
  return session.access_token;
}

async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set('x-session', token);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  return res;
}

export async function listEntries(
  params: { q?: string; category?: string } = {},
): Promise<VaultEntry[]> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  const qs = search.toString();
  const res = await authedFetch(`/api/entries${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error ?? '请求失败');
  }
  const { entries } = (await res.json()) as { entries: VaultEntry[] };
  return entries;
}

export async function createEntry(
  payload: Omit<VaultEntry, 'id' | 'created_at' | 'updated_at'>,
): Promise<VaultEntry> {
  const res = await authedFetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '创建失败' }));
    throw new Error(err.error ?? '创建失败');
  }
  const { entry } = (await res.json()) as { entry: VaultEntry };
  return entry;
}

export async function getEntry(id: string): Promise<VaultEntry> {
  const res = await authedFetch(`/api/entries/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '查询失败' }));
    throw new Error(err.error ?? '查询失败');
  }
  const { entry } = (await res.json()) as { entry: VaultEntry };
  return entry;
}

export async function updateEntry(
  id: string,
  payload: Partial<Omit<VaultEntry, 'id' | 'created_at' | 'updated_at'>>,
): Promise<VaultEntry> {
  const res = await authedFetch(`/api/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '更新失败' }));
    throw new Error(err.error ?? '更新失败');
  }
  const { entry } = (await res.json()) as { entry: VaultEntry };
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await authedFetch(`/api/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '删除失败' }));
    throw new Error(err.error ?? '删除失败');
  }
}

// ===== Notes =====

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export async function listNotes(params: { category?: string } = {}): Promise<Note[]> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  const qs = search.toString();
  const res = await authedFetch(`/api/notes${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error ?? '请求失败');
  }
  const { notes } = (await res.json()) as { notes: Note[] };
  return notes;
}

export async function createNote(
  payload: Omit<Note, 'id' | 'created_at' | 'updated_at'>,
): Promise<Note> {
  const res = await authedFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '创建失败' }));
    throw new Error(err.error ?? '创建失败');
  }
  const { note } = (await res.json()) as { note: Note };
  return note;
}

export async function updateNote(
  id: string,
  payload: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Note> {
  const res = await authedFetch(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '更新失败' }));
    throw new Error(err.error ?? '更新失败');
  }
  const { note } = (await res.json()) as { note: Note };
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await authedFetch(`/api/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '删除失败' }));
    throw new Error(err.error ?? '删除失败');
  }
}
