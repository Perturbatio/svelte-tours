/**
 * This module reads, updates, and resets StoredTourState (dismissed, completed, lastSectionKey) in localStorage
 *
 * It handles missing or restricted localStorage safely without throwing errors
 */
import type { StoredTourState } from './types';

export const DEFAULT_STORAGE_KEY = 'perturbatio_tours_state';

export function createDefaultTourState(): StoredTourState {
    return {
        dismissed: false,
        completed: false,
        lastSectionKey: null
    };
}

function getStorage(): Storage | null {
    try {
        if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
            return null;
        }
        return globalThis.localStorage;
    } catch {
        return null;
    }
}

export function loadAllTourStates(storageKey: string = DEFAULT_STORAGE_KEY): Record<string, StoredTourState> {
    const storage = getStorage();
    if (!storage) {
        return {};
    }

    try {
        const raw = storage.getItem(storageKey);
        if (!raw) {
            return {};
        }

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return {};
        }

        const result: Record<string, StoredTourState> = {};
        for (const [tourName, entry] of Object.entries(parsed)) {
            if (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
                const record = entry as Partial<StoredTourState>;
                result[tourName] = {
                    dismissed: Boolean(record.dismissed),
                    completed: Boolean(record.completed),
                    lastSectionKey: typeof record.lastSectionKey === 'string' ? record.lastSectionKey : null
                };
            }
        }
        return result;
    } catch {
        return {};
    }
}

export function saveAllTourStates(
    states: Record<string, StoredTourState>,
    storageKey: string = DEFAULT_STORAGE_KEY
): void {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    try {
        storage.setItem(storageKey, JSON.stringify(states));
    } catch {
        // Ignore storage quota or privacy mode errors.
    }
}

export function getTourState(
    tourName: string,
    storageKey: string = DEFAULT_STORAGE_KEY
): StoredTourState {
    const all = loadAllTourStates(storageKey);
    return all[tourName] ? { ...all[tourName] } : createDefaultTourState();
}

export function updateTourState(
    tourName: string,
    patch: Partial<StoredTourState>,
    storageKey: string = DEFAULT_STORAGE_KEY
): StoredTourState {
    const all = loadAllTourStates(storageKey);
    const current = all[tourName] ?? createDefaultTourState();
    const next: StoredTourState = {
        dismissed: patch.dismissed ?? current.dismissed,
        completed: patch.completed ?? current.completed,
        lastSectionKey: patch.lastSectionKey !== undefined ? patch.lastSectionKey : current.lastSectionKey
    };

    all[tourName] = next;
    saveAllTourStates(all, storageKey);
    return { ...next };
}

export function resetTourState(
    tourName: string,
    storageKey: string = DEFAULT_STORAGE_KEY
): StoredTourState {
    const all = loadAllTourStates(storageKey);
    const fresh = createDefaultTourState();
    all[tourName] = fresh;
    saveAllTourStates(all, storageKey);
    return { ...fresh };
}