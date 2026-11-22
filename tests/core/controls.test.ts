import { describe, expect, it } from 'vitest';
import {
    DEFAULT_NAV_CONTROLS,
    resolveTourNavControls,
    resolveTourTheme,
    Tour,
    TourManager
} from '../../src';

describe('Navigation Controls Resolution', () => {
    it('provides expected defaults', () => {
        expect(DEFAULT_NAV_CONTROLS).toEqual({
            showPrevious: true,
            showNext: true,
            showClose: true,
            showRestart: false,
            showStepCounter: true
        });
    });

    it('resolves controls and supports aliases', () => {
        const resolved = resolveTourNavControls(
            { showPrev: false, showRestartButton: true },
            { showCounter: false, showNext: false, showClose: false }
        );
        expect(resolved).toEqual({
            showPrevious: false,
            showNext: false,
            showClose: false,
            showRestart: true,
            showStepCounter: false,
            showTourTitle: true
        });
    });

    it('resolves cascading controls in TourTheme', () => {
        const theme = resolveTourTheme({
            showPrevious: false,
            showRestart: true
        });
        expect(theme.controls).toEqual({
            showPrevious: false,
            showNext: true,
            showClose: true,
            showRestart: true,
            showStepCounter: true,
            showTourTitle: true
        });
    });

    it('normalizes tour and section controls in Tour class', () => {
        const tour = new Tour({
            name: 'testTour',
            showClose: false,
            sections: {
                step1: {
                    elements: ['.test'],
                    showRestart: true,
                    content: { title: 'Step 1' }
                },
                step2: {
                    elements: ['.test'],
                    controls: { showNext: false },
                    content: { title: 'Step 2' }
                }
            }
        });

        expect(tour.controls?.showClose).toBe(false);
        expect(tour.sections.step1.controls?.showRestart).toBe(true);
        expect(tour.sections.step2.controls?.showNext).toBe(false);
    });

    it('resolves cascading precedence (Theme -> Tour -> Section) in TourManager', () => {
        const manager = new TourManager({ storageKey: 'test_cascading' });
        manager.setTheme({
            controls: { showPrevious: true, showClose: true, showRestart: false, showStepCounter: true, showNext: true }
        });

        manager.addTour({
            name: 'cascadingTour',
            controls: { showPrevious: false, showRestart: true },
            sections: {
                step1: {
                    elements: ['.step1'],
                    targetGraceMs: 0,
                    content: { title: 'Step 1' }
                },
                step2: {
                    elements: ['.step2'],
                    targetGraceMs: 0,
                    controls: { showPrevious: true, showStepCounter: false },
                    content: { title: 'Step 2' }
                }
            }
        });

        manager.start('cascadingTour');

        // Step 1: Tour overrides Theme (showPrevious: false, showRestart: true)
        const state1 = manager.getActiveState();
        expect(state1?.controls).toEqual({
            showPrevious: false,
            showNext: true,
            showClose: true,
            showRestart: true,
            showStepCounter: true,
            showTourTitle: true
        });

        manager.next();

        // Step 2: Section overrides Tour (showPrevious: true, showStepCounter: false)
        const state2 = manager.getActiveState();
        expect(state2?.controls).toEqual({
            showPrevious: true,
            showNext: true,
            showClose: true,
            showRestart: true,
            showStepCounter: false,
            showTourTitle: true
        });
    });
});
