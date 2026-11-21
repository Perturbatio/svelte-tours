import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountTourDom, type DomTourMountController } from '../../src';
import { TourManager } from '../../src';

function setTargetRect(
    el: Element,
    rect: { left: number; top: number; width: number; height: number }
): void {
    const fullRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => fullRect
    };
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(fullRect as DOMRect);
}

describe('mountTourDom', () => {
    let container: HTMLElement;
    let manager: TourManager;
    let controller: DomTourMountController | null;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);

        manager = new TourManager({ storageKey: 'test_dom_mount_tours' });
        manager.setTheme({
            maskBgColor: '#223344',
            maskTransparency: 0.7,
            highlightPadding: 6,
            highlightRadius: 4
        });

        controller = null;
    });

    afterEach(() => {
        controller?.destroy();
        vi.restoreAllMocks();
        container.remove();
    });

    it('mounts tour UI, applies theme CSS variables, and creates cutouts for multiple targets', async () => {
        document.body.innerHTML += `
      <button class="target-a">Target A</button>
      <button class="target-b">Target B</button>
    `;

        const targets = document.querySelectorAll('.target-a, .target-b');
        setTargetRect(targets[0], { left: 10, top: 20, width: 100, height: 40 });
        setTargetRect(targets[1], { left: 200, top: 150, width: 120, height: 50 });

        manager.addTour({
            name: 'dashboard',
            showRestartButton: true,
            nextTour: 'profile',
            sections: {
                first: {
                    elements: ['.target-a', '.target-b'],
                    targetGraceMs: 0,
                    content: {
                        title: 'Multi Target Step',
                        content: 'Two areas are highlighted.',
                        description: 'Tooltip anchors to the first target.'
                    }
                },
                second: {
                    elements: ['.target-a'],
                    targetGraceMs: 0,
                    content: {
                        title: 'Final Step',
                        content: 'Ready for next tour.'
                    }
                }
            }
        });

        manager.addTour({
            name: 'profile',
            sections: {
                intro: {
                    elements: ['.missing'],
                    targetGraceMs: 0,
                    content: { title: 'Profile Tour', content: 'Chained tour started.' }
                }
            }
        });
        controller = mountTourDom({ container, manager });
        manager.start('dashboard');
        await new Promise((resolve) => setTimeout(resolve, 0));

        const root = container.querySelector('.pt-dom-root') as HTMLElement | null;
        expect(root).not.toBeNull();
        expect(root?.style.getPropertyValue('--pt-mask-bg-color')).toBe('#223344');
        expect(root?.style.getPropertyValue('--pt-mask-transparency')).toBe('0.7');
        expect(container.textContent).toContain('Multi Target Step');
        expect(container.textContent).toContain('Two areas are highlighted.');
        expect(container.textContent).toContain('Tooltip anchors to the first target.');
        expect(container.textContent).toContain('Restart Tour');

        // Verify two cutout rects exist inside the SVG mask group.
        const cutoutRects = container.querySelectorAll('mask g rect');
        expect(cutoutRects).toHaveLength(2);
        expect(cutoutRects[0].getAttribute('x')).toBe('4');
        expect(cutoutRects[0].getAttribute('y')).toBe('14');
        expect(cutoutRects[1].getAttribute('x')).toBe('194');
        expect(cutoutRects[1].getAttribute('y')).toBe('144');

        const nextBtn = Array.from(container.querySelectorAll('button')).find((b) =>
            b.textContent?.trim().startsWith('Next')
        ) as HTMLButtonElement;
        nextBtn.click();
        await Promise.resolve();

        expect(container.textContent).toContain('Final Step');
        expect(nextBtn.textContent?.trim()).toBe('Next Tour');

        nextBtn.click();
        await Promise.resolve();
        expect(container.textContent).toContain('Profile Tour');
    });

    it('closes tour UI on Close click and removes all nodes on destroy()', async () => {
        manager.addTour({
            name: 'simple',
            sections: {
                step1: {
                    elements: ['.none'],
                    targetGraceMs: 0,
                    content: { title: 'Hello', content: 'Test message' }
                }
            }
        });

        controller = mountTourDom({ container, manager });
        manager.start('simple');
        await Promise.resolve();
        expect(container.querySelector('.pt-dom-root')).not.toBeNull();

        const closeBtn = Array.from(container.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Close'
        ) as HTMLButtonElement;
        closeBtn.click();
        await Promise.resolve();
        expect(container.querySelector('.pt-dom-root')).toBeNull();

        manager.start('simple');
        await Promise.resolve();
        expect(container.querySelector('.pt-dom-root')).not.toBeNull();

        controller.destroy();
        controller = null;
        expect(container.querySelector('.pt-dom-root')).toBeNull();
    });
});