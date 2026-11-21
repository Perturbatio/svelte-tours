import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
});