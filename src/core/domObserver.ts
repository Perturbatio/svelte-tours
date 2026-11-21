/**
 * It finds visible target elements for each selector in a section, calculates individual bounding boxes,
 * waits for missing targets with a MutationObserver and grace timer, and falls back to
 * top-centre placement when no target appears in time.
 */
import type { TargetBox, TooltipPlacement } from './types';

export interface TargetResolutionResult {
    targets: TargetBox[];
    placement: TooltipPlacement;
}

export interface ObserveTargetsOptions {
    /** Time in milliseconds to wait for missing targets before top-centre fallback. */
    graceMs: number;
    /** Called immediately when targets are found or when the grace period expires. */
    onResolve: (result: TargetResolutionResult) => void;
    /** Optional custom root node to observe; defaults to document.body. */
    observeRoot?: Node | null;
}

export interface TargetObserverController {
    /** Recalculates target bounding boxes immediately (for example on scroll or resize). */
    refresh: () => TargetResolutionResult;
    /** Stops timers, observers, and listeners. */
    destroy: () => void;
}

function isElementVisible(el: Element): boolean {
    if (!(el instanceof HTMLElement)) {
        return true;
    }

    const style = globalThis.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }

    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
}

function toTargetBox(selector: string, el: Element): TargetBox {
    const domRect = el.getBoundingClientRect();
    return {
        selector,
        rect: {
            top: domRect.top,
            left: domRect.left,
            width: domRect.width,
            height: domRect.height,
            right: domRect.right,
            bottom: domRect.bottom
        }
    };
}

/**
 * Finds all visible matching elements for each selector in order.
 * Each matched element gets its own TargetBox so multi-element cutouts stay separate.
 */
export function resolveTargetBoxes(selectors: string[]): TargetBox[] {
    if (typeof document === 'undefined' || !Array.isArray(selectors) || selectors.length === 0) {
        return [];
    }

    const boxes: TargetBox[] = [];
    const seenElements = new Set<Element>();

    for (const selector of selectors) {
        if (!selector || selector.trim() === '') {
            continue;
        }

        let matches: NodeListOf<Element>;
        try {
            matches = document.querySelectorAll(selector);
        } catch {
            continue;
        }

        for (const el of matches) {
            if (seenElements.has(el)) {
                continue;
            }
            if (!isElementVisible(el)) {
                continue;
            }
            seenElements.add(el);
            boxes.push(toTargetBox(selector, el));
        }
    }

    return boxes;
}

/**
 * Observes the DOM for target elements during a configurable grace period
 * If targets appear in time, resolves with "anchored" placement
 * If the grace period expires with no targets, resolves with "top-centre" placement
 */
export function observeSectionTargets(
    selectors: string[],
    options: ObserveTargetsOptions
): TargetObserverController {
    let destroyed = false;
    let resolved = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let mutationObserver: MutationObserver | null = null;

    const cleanupWatchers = (): void => {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
        }
    };

    const evaluate = (forceFallback: boolean): TargetResolutionResult => {
        if (destroyed) {
            return { targets: [], placement: 'top-center' };
        }

        const targets = resolveTargetBoxes(selectors);
        if (targets.length > 0) {
            resolved = true;
            cleanupWatchers();
            return { targets, placement: 'anchored' };
        }

        if (forceFallback) {
            resolved = true;
            cleanupWatchers();
            return { targets: [], placement: 'top-center' };
        }

        return { targets: [], placement: 'top-center' };
    };

    const refresh = (): TargetResolutionResult => {
        if (destroyed) {
            return { targets: [], placement: 'top-center' };
        }
        const targets = resolveTargetBoxes(selectors);
        const placement: TooltipPlacement = targets.length > 0 ? 'anchored' : 'top-center';
        const result: TargetResolutionResult = { targets, placement };
        options.onResolve(result);
        return result;
    };

    // Check immediately on start.
    const initial = evaluate(false);
    if (resolved) {
        options.onResolve(initial);
    } else if (options.graceMs <= 0) {
        const immediateFallback = evaluate(true);
        options.onResolve(immediateFallback);
    } else {
        const graceMs = Math.max(0, options.graceMs);

        if (typeof MutationObserver !== 'undefined') {
            const targetNode =
                options.observeRoot ?? (typeof document !== 'undefined' ? document.body : null);

            if (targetNode) {
                mutationObserver = new MutationObserver(() => {
                    if (destroyed || resolved) {
                        return;
                    }
                    const found = evaluate(false);
                    if (resolved) {
                        options.onResolve(found);
                    }
                });

                mutationObserver.observe(targetNode, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
        }

        timerId = setTimeout(() => {
            if (destroyed || resolved) {
                return;
            }
            const fallback = evaluate(true);
            options.onResolve(fallback);
        }, graceMs);
    }

    return {
        refresh,
        destroy: () => {
            destroyed = true;
            cleanupWatchers();
        }
    };
}