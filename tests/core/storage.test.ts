import { beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_STORAGE_KEY,
    getTourState,
    resetTourState,
    updateTourState
} from '../../src/core/storage';

describe('storage module', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns default state when no record exists', () => {
        const state = getTourState('dashboard', DEFAULT_STORAGE_KEY);
        expect(state).toEqual({
            dismissed: false,
            completed: false,
            lastSectionKey: null
        });
    });

    it('saves and updates dismissed, completed, and lastSectionKey fields', () => {
        updateTourState('dashboard', { lastSectionKey: 'helpInfo' }, DEFAULT_STORAGE_KEY);
        updateTourState('dashboard', { dismissed: true }, DEFAULT_STORAGE_KEY);

        const state = getTourState('dashboard', DEFAULT_STORAGE_KEY);
        expect(state).toEqual({
            dismissed: true,
            completed: false,
            lastSectionKey: 'helpInfo'
        });
    });

    it('resets state for one tour and keeps other tours', () => {
        updateTourState('dashboard', { dismissed: true, lastSectionKey: 'introPart2' }, DEFAULT_STORAGE_KEY);
        updateTourState('profile', { completed: true, lastSectionKey: null }, DEFAULT_STORAGE_KEY);

        resetTourState('dashboard', DEFAULT_STORAGE_KEY);

        expect(getTourState('dashboard', DEFAULT_STORAGE_KEY)).toEqual({
            dismissed: false,
            completed: false,
            lastSectionKey: null
        });
        expect(getTourState('profile', DEFAULT_STORAGE_KEY)).toEqual({
            dismissed: false,
            completed: true,
            lastSectionKey: null
        });
    });

    it('handles corrupted localStorage JSON safely', () => {
        localStorage.setItem(DEFAULT_STORAGE_KEY, '{invalid-json');
        expect(getTourState('dashboard', DEFAULT_STORAGE_KEY)).toEqual({
            dismissed: false,
            completed: false,
            lastSectionKey: null
        });
    });
});