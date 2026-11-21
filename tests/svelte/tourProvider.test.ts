import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourManager } from '../../src';
import TourProvider from '../../src/svelte/TourProvider.svelte';

describe('TourProvider component', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);

        manager = new TourManager({ storageKey: 'test_svelte_tours' });
        manager.setTheme({
            maskBgColor: '#112233',
            maskTransparency: 0.75
        });
        manager.addTour({
            name: 'onboarding',
            showRestartButton: true,
            sections: {
                step1: {
                    elements: ['.no-such-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step One', content: 'First message' }
                },
                step2: {
                    elements: ['.no-such-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step Two', content: 'Second message' }
                }
            }
        });
        manager.start('onboarding');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });
    });

    afterEach(() => {
        unmount(app);
        container.remove();
    });

    it('renders tooltip content, applies theme CSS variables, and navigates steps', async () => {
        const root = container.querySelector('.pt-root') as HTMLElement | null;
        expect(root).not.toBeNull();
        expect(root?.style.getPropertyValue('--pt-mask-bg-color')).toBe('#112233');
        expect(root?.style.getPropertyValue('--pt-mask-transparency')).toBe('0.75');
        expect(container.textContent).toContain('Step One');
        expect(container.textContent).toContain('Restart Tour');

        const prevBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Previous'
        ) as HTMLButtonElement;
        const nextBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Next'
        ) as HTMLButtonElement;

        expect(prevBtn.disabled).toBe(true);
        expect(nextBtn.disabled).toBe(false);

        nextBtn.click();
        await Promise.resolve();
        expect(container.textContent).toContain('Step Two');
        expect(prevBtn.disabled).toBe(false);
        expect(nextBtn.disabled).toBe(true);
    });

    it('hides the tour UI when Close is clicked', async () => {
        const closeBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Close'
        ) as HTMLButtonElement;

        closeBtn.click();
        await Promise.resolve();
        expect(container.querySelector('.pt-root')).toBeNull();
    });

    it('renders navigation inside tooltip by default and not in TourNavBar', () => {
        expect(container.querySelector('.pt-tooltip-footer')).not.toBeNull();
        expect(container.querySelector('.pt-navbar')).toBeNull();
    });
});

describe('TourProvider with custom nav labels and placement', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new TourManager({ storageKey: 'test_svelte_tours_labels' });
    });

    afterEach(() => {
        unmount(app);
        container.remove();
    });

    it('renders custom button labels in tooltip', async () => {
        manager.addTour({
            name: 'customTooltipLabels',
            showRestartButton: true,
            labels: {
                previous: 'Backwards',
                next: 'Forwards',
                finish: 'All Done',
                restart: 'Reset',
                close: 'Dismiss'
            },
            sections: {
                step1: {
                    elements: ['.missing-1'],
                    targetGraceMs: 0,
                    content: { title: 'Step 1' }
                },
                step2: {
                    elements: ['.missing-2'],
                    targetGraceMs: 0,
                    content: { title: 'Step 2' }
                }
            }
        });
        manager.start('customTooltipLabels');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();
        expect(container.querySelector('.pt-tooltip')).not.toBeNull();
        expect(container.textContent).toContain('Backwards');
        expect(container.textContent).toContain('Forwards');
        expect(container.textContent).toContain('Reset');
        expect(container.textContent).toContain('Dismiss');

        const nextBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Forwards'
        ) as HTMLButtonElement;
        expect(nextBtn).toBeDefined();
        nextBtn.click();
        await Promise.resolve();

        // On last step without next tour, finish label should show
        expect(container.textContent).toContain('All Done');
    });

    it('renders custom button labels in fixed TourNavBar', async () => {
        manager.addTour({
            name: 'customNavBarLabels',
            showRestartButton: true,
            navPlacement: 'bottom',
            nextTour: 'secondaryTour',
            labels: {
                previous: 'Back',
                next: 'Continue',
                nextTour: 'Go to Secondary Tour',
                restart: 'Start Over',
                close: 'Exit',
                navAriaLabel: 'Custom navigation bar'
            },
            sections: {
                step1: {
                    elements: ['.missing-1'],
                    targetGraceMs: 0,
                    content: { title: 'NavBar Step 1' }
                },
                step2: {
                    elements: ['.missing-2'],
                    targetGraceMs: 0,
                    content: { title: 'NavBar Step 2' }
                }
            }
        });

        manager.addTour({
            name: 'secondaryTour',
            sections: {
                intro: {
                    elements: ['.missing-3'],
                    targetGraceMs: 0,
                    content: { title: 'Secondary Intro' }
                }
            }
        });

        manager.start('customNavBarLabels');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();
        const nav = container.querySelector('.pt-navbar') as HTMLElement;
        expect(nav).not.toBeNull();
        expect(nav.getAttribute('aria-label')).toBe('Custom navigation bar');
        expect(nav.textContent).toContain('Start Over');
        expect(nav.textContent).toContain('Back');
        expect(nav.textContent).toContain('Continue');
        expect(nav.textContent).toContain('Exit');

        const nextBtn = Array.from(nav.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Continue'
        ) as HTMLButtonElement;
        nextBtn.click();
        await Promise.resolve();

        // On last section with nextTour, nextTour label should show
        expect(nav.textContent).toContain('Go to Secondary Tour');

        const nextTourBtn = Array.from(nav.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Go to Secondary Tour'
        ) as HTMLButtonElement;
        nextTourBtn.click();
        await Promise.resolve();

        expect(manager.getActiveState()?.tourName).toBe('secondaryTour');
    });
});

describe('TourProvider restart positioning', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new TourManager({ storageKey: 'test_svelte_tours_restart' });
    });

    afterEach(() => {
        unmount(app);
        vi.restoreAllMocks();
        container.remove();
    });

    it('positions tooltip at the first section element when restarted whilst on the first section', async () => {
        const target1 = document.createElement('div');
        target1.className = 'section-target-1';
        target1.textContent = 'Section 1 Target';
        document.body.appendChild(target1);

        const target2 = document.createElement('div');
        target2.className = 'section-target-2';
        target2.textContent = 'Section 2 Target';
        document.body.appendChild(target2);

        const fullRect1 = {
            left: 100,
            top: 200,
            width: 150,
            height: 50,
            right: 250,
            bottom: 250,
            x: 100,
            y: 200,
            toJSON: () => fullRect1
        };
        vi.spyOn(target1, 'getBoundingClientRect').mockReturnValue(fullRect1 as DOMRect);

        const fullRect2 = {
            left: 300,
            top: 400,
            width: 150,
            height: 50,
            right: 450,
            bottom: 450,
            x: 300,
            y: 400,
            toJSON: () => fullRect2
        };
        vi.spyOn(target2, 'getBoundingClientRect').mockReturnValue(fullRect2 as DOMRect);

        manager.addTour({
            name: 'restartTour',
            showRestartButton: true,
            sections: {
                step1: {
                    elements: ['.section-target-1'],
                    targetGraceMs: 0,
                    content: { title: 'First Section' }
                },
                step2: {
                    elements: ['.section-target-2'],
                    targetGraceMs: 0,
                    content: { title: 'Second Section' }
                }
            }
        });
        manager.start('restartTour');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();

        const tooltip = container.querySelector('.pt-tooltip') as HTMLElement;
        expect(tooltip).not.toBeNull();
        expect(manager.getActiveState()?.placement).toBe('anchored');
        expect(manager.getActiveState()?.targets).toHaveLength(1);
        expect(tooltip.style.top).not.toBe('24px');

        // Now restart while on the first section
        const restartBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Restart Tour'
        ) as HTMLButtonElement;
        expect(restartBtn).toBeDefined();

        restartBtn.click();
        await Promise.resolve();

        expect(manager.getActiveState()?.sectionKey).toBe('step1');
        expect(manager.getActiveState()?.placement).toBe('anchored');
        expect(manager.getActiveState()?.targets).toHaveLength(1);
        expect(tooltip.style.top).not.toBe('24px');

        target1.remove();
        target2.remove();
    });

    it('positions tooltip at the first section element when restarted from another section', async () => {
        const target1 = document.createElement('div');
        target1.className = 'section-target-1';
        target1.textContent = 'Section 1 Target';
        document.body.appendChild(target1);

        const target2 = document.createElement('div');
        target2.className = 'section-target-2';
        target2.textContent = 'Section 2 Target';
        document.body.appendChild(target2);

        const fullRect1 = {
            left: 100,
            top: 200,
            width: 150,
            height: 50,
            right: 250,
            bottom: 250,
            x: 100,
            y: 200,
            toJSON: () => fullRect1
        };
        vi.spyOn(target1, 'getBoundingClientRect').mockReturnValue(fullRect1 as DOMRect);

        const fullRect2 = {
            left: 300,
            top: 400,
            width: 150,
            height: 50,
            right: 450,
            bottom: 450,
            x: 300,
            y: 400,
            toJSON: () => fullRect2
        };
        vi.spyOn(target2, 'getBoundingClientRect').mockReturnValue(fullRect2 as DOMRect);

        manager.addTour({
            name: 'restartTourFromStep2',
            showRestartButton: true,
            sections: {
                step1: {
                    elements: ['.section-target-1'],
                    targetGraceMs: 0,
                    content: { title: 'First Section' }
                },
                step2: {
                    elements: ['.section-target-2'],
                    targetGraceMs: 0,
                    content: { title: 'Second Section' }
                }
            }
        });
        manager.start('restartTourFromStep2');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();

        // Move to step 2
        manager.next();
        await Promise.resolve();
        expect(manager.getActiveState()?.sectionKey).toBe('step2');

        // Restart from step 2
        const restartBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Restart Tour'
        ) as HTMLButtonElement;
        expect(restartBtn).toBeDefined();

        restartBtn.click();
        await Promise.resolve();

        const tooltip = container.querySelector('.pt-tooltip') as HTMLElement;
        expect(manager.getActiveState()?.sectionKey).toBe('step1');
        expect(manager.getActiveState()?.placement).toBe('anchored');
        expect(manager.getActiveState()?.targets).toHaveLength(1);
        expect(tooltip.style.top).not.toBe('24px');

        target1.remove();
        target2.remove();
    });
});