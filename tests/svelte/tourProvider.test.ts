import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourManager } from '../../src';
import TourProvider from '../../src/svelte/TourProvider.svelte';
import SnippetTestWrapper from './SnippetTestWrapper.svelte';

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

describe('TourProvider HTML label rendering', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new TourManager({ storageKey: 'test_html_labels' });
    });

    afterEach(() => {
        unmount(app);
        container.remove();
    });

    it('renders HTML markup inside button labels in tooltip', async () => {
        manager.addTour({
            name: 'htmlLabelsTour',
            showRestart: true,
            labels: {
                previous: '<span class="icon-prev">←</span> Prev',
                next: '<span class="icon-next">→</span> Next',
                restart: '<strong>Restart</strong>',
                close: '<em>Close</em>'
            },
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'HTML Step 1' }
                }
            }
        });
        manager.start('htmlLabelsTour');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();

        expect(container.querySelector('.icon-prev')).not.toBeNull();
        expect(container.querySelector('.icon-next')).not.toBeNull();
        expect(container.querySelector('strong')?.textContent).toBe('Restart');
        expect(container.querySelector('em')?.textContent).toBe('Close');
    });

    it('renders HTML markup inside button labels in navbar', async () => {
        manager.addTour({
            name: 'htmlLabelsNavBar',
            navPlacement: 'top',
            showRestart: true,
            labels: {
                previous: '<span class="navbar-prev">Back</span>',
                next: '<span class="navbar-next">Forward</span>',
                restart: '<span class="navbar-restart">Again</span>',
                close: '<span class="navbar-close">Exit</span>'
            },
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'HTML NavBar Step' }
                }
            }
        });
        manager.start('htmlLabelsNavBar');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();

        expect(container.querySelector('.navbar-prev')).not.toBeNull();
        expect(container.querySelector('.navbar-next')).not.toBeNull();
        expect(container.querySelector('.navbar-restart')).not.toBeNull();
        expect(container.querySelector('.navbar-close')).not.toBeNull();
    });
});

describe('TourProvider Navigation Controls Visibility', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new TourManager({ storageKey: 'test_controls_vis' });
    });

    afterEach(() => {
        unmount(app);
        container.remove();
    });

    it('hides previous and close buttons when showPrevious: false and showClose: false', async () => {
        manager.addTour({
            name: 'hideControlsTour',
            controls: {
                showPrevious: false,
                showClose: false,
                showStepCounter: false
            },
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step 1' }
                }
            }
        });
        manager.start('hideControlsTour');

        app = mount(TourProvider, {
            target: container,
            props: { manager }
        });

        await Promise.resolve();

        expect(container.querySelector('.pt-btn-close')).toBeNull();
        expect(container.querySelector('.pt-step-counter')).toBeNull();

        const buttons = Array.from(container.querySelectorAll('button'));
        const prevBtn = buttons.find((b) => b.textContent?.trim() === 'Previous');
        const nextBtn = buttons.find((b) => b.textContent?.trim() === 'Next');

        expect(prevBtn).toBeUndefined();
        expect(nextBtn).toBeDefined();
    });

    it('allows TourProvider prop controls to override active tour controls', async () => {
        manager.addTour({
            name: 'providerOverrideTour',
            controls: {
                showPrevious: true,
                showNext: true,
                showRestart: false
            },
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step 1' }
                }
            }
        });
        manager.start('providerOverrideTour');

        app = mount(TourProvider, {
            target: container,
            props: {
                manager,
                controls: {
                    showNext: false,
                    showRestart: true
                }
            }
        });

        await Promise.resolve();

        const buttons = Array.from(container.querySelectorAll('button'));
        const nextBtn = buttons.find((b) => b.textContent?.trim() === 'Next');
        const restartBtn = buttons.find((b) => b.textContent?.trim() === 'Restart Tour');

        expect(nextBtn).toBeUndefined();
        expect(restartBtn).toBeDefined();
    });
});

describe('TourProvider Svelte 5 Snippets', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let app: Record<string, unknown>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        manager = new TourManager({ storageKey: 'test_snippets' });
    });

    afterEach(() => {
        unmount(app);
        container.remove();
    });

    it('renders custom inner label snippets and custom step counter snippet', async () => {
        manager.addTour({
            name: 'innerSnippetsTour',
            showRestart: true,
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step One' }
                },
                step2: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step Two' }
                }
            }
        });
        manager.start('innerSnippetsTour');

        app = mount(SnippetTestWrapper, {
            target: container,
            props: {
                manager,
                useInnerSnippets: true
            }
        });

        await Promise.resolve();

        expect(container.querySelector('.custom-next-label')?.textContent).toBe('Custom Next (1/2)');
        expect(container.querySelector('.custom-prev-label')?.textContent).toBe('Custom Prev (disabled: true)');
        expect(container.querySelector('.custom-close-label')?.textContent).toBe('Custom Close');
        expect(container.querySelector('.custom-restart-label')?.textContent).toBe('Custom Restart');
        expect(container.querySelector('.custom-step-counter')?.textContent).toBe('Step 1 of 2 in innerSnippetsTour');

        // Verify default button classes are still preserved around inner snippets
        expect(container.querySelector('.pt-btn-primary .custom-next-label')).not.toBeNull();
        expect(container.querySelector('.pt-btn-secondary .custom-prev-label')).not.toBeNull();
    });

    it('replaces button elements completely with full button wrapper snippets', async () => {
        manager.addTour({
            name: 'buttonSnippetsTour',
            showRestart: true,
            sections: {
                step1: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step One' }
                },
                step2: {
                    elements: ['.no-el'],
                    targetGraceMs: 0,
                    content: { title: 'Step Two' }
                }
            }
        });
        manager.start('buttonSnippetsTour');

        app = mount(SnippetTestWrapper, {
            target: container,
            props: {
                manager,
                useButtonSnippets: true
            }
        });

        await Promise.resolve();

        const customNext = container.querySelector('.custom-next-btn') as HTMLButtonElement;
        const customPrev = container.querySelector('.custom-prev-btn') as HTMLButtonElement;
        const customClose = container.querySelector('.custom-close-btn') as HTMLButtonElement;
        const customRestart = container.querySelector('.custom-restart-btn') as HTMLButtonElement;

        expect(customNext).not.toBeNull();
        expect(customPrev).not.toBeNull();
        expect(customClose).not.toBeNull();
        expect(customRestart).not.toBeNull();

        expect(customPrev.disabled).toBe(true);
        expect(customNext.disabled).toBe(false);

        // Standard buttons should NOT be present
        expect(container.querySelector('.pt-btn-primary')).toBeNull();

        // Clicking custom next advances tour
        customNext.click();
        await Promise.resolve();

        expect(manager.getActiveState()?.sectionKey).toBe('step2');
        expect(customPrev.disabled).toBe(false);
        expect(customNext.disabled).toBe(true);
    });
});