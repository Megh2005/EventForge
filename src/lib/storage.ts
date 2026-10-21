import { writable, get } from 'svelte/store';
import type { EventItem, VaultConfig } from './types';
import { playPop, playSuccess, playDelete } from './sound';

export const events = writable<EventItem[]>([]);
export const vaultConfig = writable<VaultConfig>({
  storagePath: 'Loading local ROM storage...',
  isConfigured: false,
  hasApiKey: false,
  geminiModel: 'gemini-3.5-flash',
  currency: 'USD',
  currencySymbol: '$'
});

export const isSaving = writable<boolean>(false);
export const lastSavedAt = writable<string>('Not saved yet');
export const saveError = writable<string | null>(null);

let saveTimeout: any = null;

// Fetch config from local machine backend
export async function fetchVaultConfig(): Promise<VaultConfig> {
  try {
    const res = await fetch('/api/storage/config');
    if (!res.ok) throw new Error('Failed to read local vault config');
    const data: VaultConfig = await res.json();
    vaultConfig.set(data);
    return data;
  } catch (err: any) {
    console.error('[Storage] Error loading vault config:', err);
    saveError.set(err.message);
    throw err;
  }
}

// Update local computer storage directory path, currency & API settings
export async function updateVaultConfig(
  newPath: string, 
  apiKey?: string, 
  model?: string,
  currency?: string,
  currencySymbol?: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storagePath: newPath,
        geminiApiKey: apiKey,
        geminiModel: model || 'gemini-3.5-flash',
        currency,
        currencySymbol
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update storage directory');
    }

    await fetchVaultConfig();
    playSuccess();
    return true;
  } catch (err: any) {
    console.error('[Storage] Error updating config:', err);
    saveError.set(err.message);
    alert(`Storage Error: ${err.message}`);
    return false;
  }
}

// Load all events from computer internal disk / ROM
export async function loadEventsFromDisk(): Promise<EventItem[]> {
  try {
    const res = await fetch('/api/storage/events');
    if (!res.ok) throw new Error('Could not read from local computer disk');
    const data = await res.json();
    const list: EventItem[] = data.events || [];
    events.set(list);
    lastSavedAt.set(new Date().toLocaleTimeString());
    return list;
  } catch (err: any) {
    console.error('[Storage] Error reading events from disk:', err);
    saveError.set(err.message);
    return [];
  }
}

// Persist entire events array to computer disk
export async function saveEventsToDisk(newEvents: EventItem[]): Promise<boolean> {
  isSaving.set(true);
  saveError.set(null);

  try {
    const res = await fetch('/api/storage/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: newEvents })
    });

    if (!res.ok) throw new Error('Failed to write events to computer disk');
    const data = await res.json();

    events.set(newEvents);
    lastSavedAt.set(new Date().toLocaleTimeString());
    isSaving.set(false);
    return true;
  } catch (err: any) {
    console.error('[Storage] Error persisting to disk:', err);
    saveError.set(err.message);
    isSaving.set(false);
    return false;
  }
}

// Save single event immediately to computer disk
export async function saveSingleEvent(event: EventItem): Promise<boolean> {
  const current = get(events);
  const idx = current.findIndex(e => e.id === event.id);
  let updatedList: EventItem[];

  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = { ...event, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [{ ...event, updatedAt: new Date().toISOString() }, ...current];
  }

  // Optimistic store update
  events.set(updatedList);
  playPop();

  // Debounced auto-save to computer storage
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveEventsToDisk(updatedList);
  }, 300);

  return true;
}

// Delete event from computer disk
export async function deleteEventFromDisk(id: string): Promise<boolean> {
  try {
    playDelete();
    const res = await fetch(`/api/storage/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event from disk');

    const current = get(events);
    const updated = current.filter(e => e.id !== id);
    events.set(updated);
    lastSavedAt.set(new Date().toLocaleTimeString());
    return true;
  } catch (err: any) {
    console.error('[Storage] Error deleting event:', err);
    saveError.set(err.message);
    return false;
  }
}

// Load Starter Seed Events
export async function seedStarterEvents(): Promise<boolean> {
  try {
    const res = await fetch('/api/storage/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed starter events');
    const data = await res.json();
    events.set(data.events || []);
    playSuccess();
    return true;
  } catch (err: any) {
    console.error('[Storage] Error seeding starter events:', err);
    return false;
  }
}

// Open folder directly in Windows Explorer
export async function openFolderInExplorer(): Promise<void> {
  try {
    playPop();
    await fetch('/api/storage/open-folder', { method: 'POST' });
  } catch (err) {
    console.error('[Storage] Could not open folder:', err);
  }
}

// Export raw JSON file directly for the user
export function exportVaultJSON() {
  const allEvents = get(events);
  const config = get(vaultConfig);
  const jsonStr = JSON.stringify({
    vaultSource: config.storagePath,
    exportedAt: new Date().toISOString(),
    total: allEvents.length,
    events: allEvents
  }, null, 2);

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  playSuccess();
}
