import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeSectionTargets, resolveTargetBoxes } from '../../src/core/domObserver';

function mockRect(el: Element, rect: { left: number; top: number; width: number; height: number }): void {
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

describe('domObserver', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('creates separate TargetBox entries for multiple matching selectors', () => {
        document.body.innerHTML = `
      <button class="help-btn">Help 1</button>
      <div class="middle-content">Masked area</div>
      <button class="help-btn">Help 2</button>
    `;

        const buttons = document.querySelectorAll('.help-btn');
        mockRect(buttons[0], { left: 20, top: 10, width: 80, height: 32 });
        mockRect(buttons[1], { left: 20, top: 300, width: 80, height: 32 });

        const boxes = resolveTargetBoxes(['.help-btn']);
        expect(boxes).toHaveLength(2);
        expect(boxes[0].rect.top).toBe(10);
        expect(boxes[1].rect.top).toBe(300);
    });

    it('resolves with top-center placement after grace period when targets are missing', () => {
        const onResolve = vi.fn();
        const controller = observeSectionTargets(['.missing-target'], {
            graceMs: 500,
            onResolve
        });

        expect(onResolve).not.toHaveBeenCalled();

        vi.advanceTimersByTime(499);
        expect(onResolve).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onResolve).toHaveBeenCalledTimes(1);
        expect(onResolve).toHaveBeenCalledWith({
            targets: [],
            placement: 'top-center'
        });

        controller.destroy();
    });

    it('resolves early with anchored placement when target appears during grace period', async () => {
        const onResolve = vi.fn();
        const controller = observeSectionTargets(['.late-target'], {
            graceMs: 1000,
            onResolve
        });

        const el = document.createElement('button');
        el.className = 'late-target';
        mockRect(el, { left: 50, top: 40, width: 100, height: 40 });
        document.body.appendChild(el);

        // Flush MutationObserver microtask callback.
        await Promise.resolve();

        expect(onResolve).toHaveBeenCalledTimes(1);
        expect(onResolve).toHaveBeenCalledWith({
            targets: [
                {
                    selector: '.late-target',
                    rect: {
                        left: 50,
                        top: 40,
                        width: 100,
                        height: 40,
                        right: 150,
                        bottom: 80
                    }
                }
            ],
            placement: 'anchored'
        });

        controller.destroy();
    });
});