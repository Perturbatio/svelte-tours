import { beforeEach, describe, expect, it } from 'vitest';
import { getTourState } from '../../src/core/storage';
import { Tour } from '../../src/core/Tour';
import { TourManager } from '../../src/core/TourManager';
import type { TourConfig } from '../../src/core/types';

const STORAGE_KEY = 'test_perturbatio_tours';

function createDashboardTour(overrides: Partial<TourConfig> = {}): TourConfig {
    return {
        name: 'dashboard',
        showRestartButton: true,
        sections: {
            intro: {
                elements: ['.start-intro-tour'],
                content: { title: 'Welcome', content: 'Intro step' }
            },
            helpInfo: {
                elements: ['.help-button', '.sidebar-help-button'],
                content: { title: 'Help', description: 'Help targets' }
            }
        },
        ...overrides
    };
}

function createProfileTour(): TourConfig {
    return {
        name: 'userProfile',
        sections: {
            avatar: {
                elements: ['.profile-avatar'],
                content: { title: 'Profile Avatar', content: 'Update your photo' }
            }
        }
    };
}

describe('TourManager', () => {
    let eventTarget: EventTarget;
    let manager: TourManager;

    beforeEach(() => {
        localStorage.clear();
        eventTarget = new EventTarget();
        manager = new TourManager({
            storageKey: STORAGE_KEY,
            eventTarget
        });
    });

    it('enforces a single active tour when starting another tour', () => {
        manager.addTour(createDashboardTour());
        manager.addTour(createProfileTour());

        manager.start('dashboard');
        expect(manager.getActiveState()?.tourName).toBe('dashboard');

        manager.start('userProfile');
        expect(manager.getActiveState()?.tourName).toBe('userProfile');
        expect(manager.getActiveState()?.sectionKey).toBe('avatar');
    });

    it('disables previous on first section and next on last section without nextTour', () => {
        manager.addTour(createDashboardTour());
        manager.start('dashboard');

        expect(manager.getActiveState()?.canGoPrevious).toBe(false);
        expect(manager.getActiveState()?.canGoNext).toBe(true);

        manager.next();
        expect(manager.getActiveState()?.sectionKey).toBe('helpInfo');
        expect(manager.getActiveState()?.canGoPrevious).toBe(true);
        expect(manager.getActiveState()?.canGoNext).toBe(false);
    });

    it('chains to nextTour when clicking Next on the last section', () => {
        manager.addTour(createDashboardTour({ nextTour: 'userProfile' }));
        manager.addTour(createProfileTour());

        manager.start('dashboard');
        manager.next(); // Move to helpInfo
        expect(manager.getActiveState()?.canGoNext).toBe(true);
        expect(manager.getActiveState()?.hasNextTour).toBe(true);

        const chained = manager.next(); // Complete dashboard and start userProfile
        expect(chained).toBe(true);
        expect(manager.getActiveState()?.tourName).toBe('userProfile');
        expect(manager.getActiveState()?.sectionKey).toBe('avatar');
        expect(getTourState('dashboard', STORAGE_KEY).completed).toBe(true);
    });

    it('prevents auto-start after close and resumes at saved section when started again', () => {
        manager.addTour(createDashboardTour({ autoStart: true }));
        expect(manager.getActiveState()?.tourName).toBe('dashboard');
        expect(manager.getActiveState()?.sectionKey).toBe('intro');

        manager.next();
        expect(manager.getActiveState()?.sectionKey).toBe('helpInfo');

        manager.close();
        expect(manager.getActiveState()).toBeNull();
        expect(getTourState('dashboard', STORAGE_KEY)).toEqual({
            dismissed: true,
            completed: false,
            lastSectionKey: 'helpInfo'
        });

        // Re-adding an autoStart tour should not start automatically after close.
        const secondManager = new TourManager({ storageKey: STORAGE_KEY, eventTarget });
        secondManager.addTour(new Tour(createDashboardTour({ autoStart: true })));
        expect(secondManager.getActiveState()).toBeNull();

        // Explicit start resumes at the saved section.
        secondManager.start('dashboard');
        expect(secondManager.getActiveState()?.tourName).toBe('dashboard');
        expect(secondManager.getActiveState()?.sectionKey).toBe('helpInfo');
    });

    it('resets stored state and starts from section 0 on restart', () => {
        manager.addTour(createDashboardTour({ autoStart: true }));
        manager.next();
        manager.close();

        manager.restart('dashboard');
        expect(manager.getActiveState()?.tourName).toBe('dashboard');
        expect(manager.getActiveState()?.sectionKey).toBe('intro');
        expect(getTourState('dashboard', STORAGE_KEY).dismissed).toBe(false);
    });

    it('starts a tour when its configured triggerEvent fires', () => {
        manager.addTour(createProfileTour() as TourConfig);
        manager.addTour({
            ...createProfileTour(),
            triggerEvent: 'open-profile-tour'
        });

        expect(manager.getActiveState()).toBeNull();
        eventTarget.dispatchEvent(new Event('open-profile-tour'));
        expect(manager.getActiveState()?.tourName).toBe('userProfile');
    });
});