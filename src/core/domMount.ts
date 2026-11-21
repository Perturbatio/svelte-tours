/**
 * This helper subscribes to a TourManager instance, observes target elements during
 * the grace period, updates cutouts on scroll and resize, and renders the mask
 * and tooltip using DOM elements and --pt-* CSS custom properties.
 *
 * Projects that do not use Svelte can import it from @perturbatio/svelte-tours/core to render
 * the overlay mask, target cutouts, and tooltip card directly into the DOM.
 */
/**
 * Example usage without Svelte:
 * ```JS
 * import { mountTourDom, tours } from '@perturbatio/svelte-tours/core';
 *
 * const controller = mountTourDom();
 *
 * tours.addTour({
 *   name: 'dashboard',
 *   autoStart: true,
 *   sections: {
 *     intro: {
 *       elements: ['.start-intro-tour'],
 *       content: { title: 'Welcome', content: 'Start here.' }
 *     }
 *   }
 * });
 *
 * // Later, when cleaning up:
 * // controller.destroy();
 * ```
 */
import { observeSectionTargets, type TargetObserverController } from './domObserver';
import { tours as defaultManager, type TourManager } from './TourManager';
import type { ActiveSectionState, TargetBox, TourTheme } from './types';

export interface DomTourMountOptions {
    /** Target container where the tour UI mounts; defaults to document.body. */
    container?: HTMLElement;
    /** TourManager instance to observe; defaults to the shared tours instance. */
    manager?: TourManager;
}

export interface DomTourMountController {
    /** Removes DOM nodes, listeners, and observers. */
    destroy: () => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, tag);
}

function createButton(label: string, className: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
}

function applyThemeVariables(root: HTMLElement, manager: TourManager): void {
    const vars = manager.getThemeCssVariables();
    for (const [prop, value] of Object.entries(vars)) {
        root.style.setProperty(prop, value);
    }
}

function applyTooltipPosition(
    tooltip: HTMLElement,
    state: ActiveSectionState,
    padding: number
): void {
    console.log('applyTooltipPosition', state.anchorRect, state.placement, padding);
    if (!state.anchorRect) {
        switch(state.placement) {
            case 'top-center':
                tooltip.style.top = '24px';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                break;
            // case 'bottom-center':
            //     tooltip.style.bottom = '24px';
            //     tooltip.style.left = '50%';
            //     tooltip.style.transform = 'translateX(-50%)';
            //     break;
            // case 'left-center':
            //     tooltip.style.left = '24px';
            //     tooltip.style.top = '50%';
            //     tooltip.style.transform = 'translateY(-50%)';
            //     break;
            // case 'right-center':
            //     tooltip.style.right = '24px';
            //     tooltip.style.top = '50%';
            //     tooltip.style.transform = 'translateY(-50%)';
            //     break;
            default:
                tooltip.style.top = '24px';
                tooltip.style.left = '100%';
                tooltip.style.transform = 'translateX(-50%)';
        }
        return;
    }

    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const gap = padding + 12;

    const belowTop = state.anchorRect.bottom + gap;
    const spaceBelow = viewportHeight - belowTop;
    const spaceAbove = state.anchorRect.top - gap;

    const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const topPos = placeAbove
        ? Math.max(16, spaceAbove - 160)
        : Math.min(viewportHeight - 180, belowTop);
    /** Clamp left position to ensure tooltip is fully visible in viewport. */
    const clampedLeft = Math.max(16, Math.min(state.anchorRect.left, viewportWidth - 376));

    tooltip.style.top = `${Math.round(topPos)}px`;
    tooltip.style.left = `${Math.round(clampedLeft)}px`;
    tooltip.style.transform = 'none';
}

function renderCutouts(
    maskGroup: SVGGElement,
    targets: TargetBox[],
    padding: number,
    radius: number
): void {
    maskGroup.innerHTML = '';

    for (const target of targets) {
        const rectEl = createSvgElement('rect');
        rectEl.setAttribute('x', String(target.rect.left - padding));
        rectEl.setAttribute('y', String(target.rect.top - padding));
        rectEl.setAttribute('width', String(Math.max(0, target.rect.width + padding * 2)));
        rectEl.setAttribute('height', String(Math.max(0, target.rect.height + padding * 2)));
        rectEl.setAttribute('rx', String(radius));
        rectEl.setAttribute('ry', String(radius));
        rectEl.setAttribute('fill', '#000000');
        maskGroup.appendChild(rectEl);
    }
}

function applyBaseStyles(
    root: HTMLElement,
    overlay: HTMLDivElement,
    svg: SVGSVGElement,
    maskRect: SVGRectElement,
    tooltip: HTMLElement,
    theme: TourTheme
): void {
    root.style.position = 'relative';

    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = 'var(--pt-z-index, 9999)';

    svg.style.display = 'block';
    svg.style.width = '100vw';
    svg.style.height = '100vh';

    maskRect.setAttribute('fill', 'var(--pt-mask-bg-color, #000000)');
    maskRect.setAttribute('fill-opacity', 'var(--pt-mask-transparency, 0.6)');

    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = 'calc(var(--pt-z-index, 9999) + 1)';
    tooltip.style.width = '100%';
    tooltip.style.maxWidth = 'var(--pt-tip-max-width, 360px)';
    tooltip.style.padding = '16px';
    tooltip.style.backgroundColor = 'var(--pt-tip-bg-color, #ffffff)';
    tooltip.style.color = 'var(--pt-tip-text-color, #111827)';
    tooltip.style.borderRadius = 'var(--pt-tip-border-radius, 8px)';
    tooltip.style.boxShadow = 'var(--pt-tip-shadow, 0 10px 25px rgba(0, 0, 0, 0.2))';
    tooltip.style.fontFamily = 'inherit';

    void theme;
}

/**
 * Mounts the tour overlay and tooltip using plain DOM elements.
 * Use this in projects that do not use Svelte.
 */
export function mountTourDom(options: DomTourMountOptions = {}): DomTourMountController {
    if (typeof document === 'undefined') {
        return { destroy: () => {} };
    }

    const manager = options.manager ?? defaultManager;
    const container = options.container ?? document.body;
    const maskId = `pt-dom-mask-${Math.random().toString(36).slice(2, 10)}`;

    const root = document.createElement('div');
    root.className = 'pt-dom-root';

    const overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const svg = createSvgElement('svg');
    const defs = createSvgElement('defs');
    const mask = createSvgElement('mask');
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');

    const fullScreenWhite = createSvgElement('rect');
    fullScreenWhite.setAttribute('x', '0');
    fullScreenWhite.setAttribute('y', '0');
    fullScreenWhite.setAttribute('width', '100%');
    fullScreenWhite.setAttribute('height', '100%');
    fullScreenWhite.setAttribute('fill', '#ffffff');

    const cutoutsGroup = createSvgElement('g');
    mask.appendChild(fullScreenWhite);
    mask.appendChild(cutoutsGroup);
    defs.appendChild(mask);

    const maskRect = createSvgElement('rect');
    maskRect.setAttribute('x', '0');
    maskRect.setAttribute('y', '0');
    maskRect.setAttribute('width', '100%');
    maskRect.setAttribute('height', '100%');
    maskRect.setAttribute('mask', `url(#${maskId})`);

    svg.appendChild(defs);
    svg.appendChild(maskRect);
    overlay.appendChild(svg);

    const tooltip = document.createElement('section');
    tooltip.className = 'pt-tooltip';
    tooltip.setAttribute('role', 'dialog');
    tooltip.setAttribute('aria-modal', 'false');

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.gap = '12px';
    header.style.marginBottom = '8px';

    const titleEl = document.createElement('h2');
    titleEl.style.margin = '0';
    titleEl.style.fontSize = '16px';
    titleEl.style.fontWeight = '600';
    titleEl.style.color = 'var(--pt-tip-title-color, #000000)';

    const closeBtn = createButton('Close', 'pt-btn-close', () => manager.close());
    closeBtn.style.padding = '6px 12px';
    closeBtn.style.fontSize = '13px';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.color = 'inherit';
    closeBtn.style.border = '1px solid currentColor';

    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    tooltip.appendChild(header);

    const bodyEl = document.createElement('p');
    bodyEl.style.margin = '0 0 10px';
    bodyEl.style.fontSize = '14px';
    bodyEl.style.lineHeight = '1.45';
    tooltip.appendChild(bodyEl);

    const descEl = document.createElement('p');
    descEl.style.margin = '0 0 10px';
    descEl.style.fontSize = '14px';
    descEl.style.lineHeight = '1.45';
    descEl.style.opacity = '0.85';
    tooltip.appendChild(descEl);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.gap = '8px';
    footer.style.marginTop = '12px';

    const counter = document.createElement('span');
    counter.style.fontSize = '12px';
    counter.style.opacity = '0.75';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '8px';

    let currentTourName: string | undefined;

    const restartBtn = createButton('Restart Tour', 'pt-btn-secondary', () =>
        manager.restart(currentTourName)
    );
    restartBtn.style.padding = '6px 12px';
    restartBtn.style.fontSize = '13px';
    restartBtn.style.borderRadius = '6px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.backgroundColor = 'transparent';
    restartBtn.style.color = 'inherit';
    restartBtn.style.border = '1px solid currentColor';

    const prevBtn = createButton('Previous', 'pt-btn-secondary', () => manager.previous());
    prevBtn.style.padding = '6px 12px';
    prevBtn.style.fontSize = '13px';
    prevBtn.style.borderRadius = '6px';
    prevBtn.style.backgroundColor = 'transparent';
    prevBtn.style.color = 'inherit';
    prevBtn.style.border = '1px solid currentColor';

    const nextBtn = createButton('Next', 'pt-btn-primary', () => manager.next());
    nextBtn.style.padding = '6px 12px';
    nextBtn.style.fontSize = '13px';
    nextBtn.style.borderRadius = '6px';
    nextBtn.style.backgroundColor = 'var(--pt-button-bg-color, #2563eb)';
    nextBtn.style.color = 'var(--pt-button-text-color, #ffffff)';
    nextBtn.style.border = '1px solid transparent';

    actions.appendChild(restartBtn);
    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);
    footer.appendChild(counter);
    footer.appendChild(actions);
    tooltip.appendChild(footer);

    root.appendChild(overlay);
    root.appendChild(tooltip);

    let observerController: TargetObserverController | null = null;
    let observedSectionKey: string | null = null;
    let observedTourName: string | null = null;
    let mountedInDom = false;
    let currentRenderState: ActiveSectionState | null = null;

    const stopObserver = (): void => {
        if (observerController) {
            observerController.destroy();
            observerController = null;
        }
        observedSectionKey = null;
        observedTourName = null;
    };

    const handleViewportChange = (): void => {
        observerController?.refresh();
    };

    const renderState = (state: ActiveSectionState | null): void => {
        currentRenderState = state;
        const theme = manager.getTheme();
        applyThemeVariables(root, manager);
        applyBaseStyles(root, overlay, svg, maskRect, tooltip, theme);

        if (!state) {
            stopObserver();
            if (mountedInDom && root.parentElement) {
                root.parentElement.removeChild(root);
                mountedInDom = false;
            }
            return;
        }

        if (!mountedInDom) {
            container.appendChild(root);
            mountedInDom = true;
        }

        if (observedTourName !== state.tourName || observedSectionKey !== state.sectionKey) {
            stopObserver();
            observedTourName = state.tourName;
            observedSectionKey = state.sectionKey;

            const graceMs = manager.getGracePeriodMs(state.section);
            observerController = observeSectionTargets(state.section.elements, {
                graceMs,
                onResolve: (result) => {
                    manager.setSectionTargets(result.targets, result.placement);
                }
            });

            if (currentRenderState !== state) {
                return;
            }
        }

        renderCutouts(cutoutsGroup, state.targets, theme.highlightPadding, theme.highlightRadius);

        currentTourName = state.tourName;
        tooltip.setAttribute('aria-label', state.section.content.title);
        titleEl.textContent = state.section.content.title;

        if (state.section.content.content) {
            bodyEl.textContent = state.section.content.content;
            bodyEl.style.display = '';
        } else {
            bodyEl.textContent = '';
            bodyEl.style.display = 'none';
        }

        if (state.section.content.description) {
            descEl.textContent = state.section.content.description;
            descEl.style.display = '';
        } else {
            descEl.textContent = '';
            descEl.style.display = 'none';
        }

        const labels = state.labels;
        closeBtn.textContent = labels.close;
        closeBtn.setAttribute('aria-label', labels.closeAriaLabel);

        counter.textContent = `${state.sectionIndex + 1} / ${state.totalSections}`;

        restartBtn.textContent = labels.restart;
        restartBtn.style.display = state.showRestartButton ? '' : 'none';

        prevBtn.textContent = labels.previous;
        prevBtn.disabled = !state.canGoPrevious;
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
        prevBtn.style.opacity = prevBtn.disabled ? '0.45' : '1';

        const isLast = state.sectionIndex === state.totalSections - 1;
        if (isLast && state.hasNextTour) {
            nextBtn.textContent = labels.nextTour;
        } else if (isLast && !state.hasNextTour && labels.finish) {
            nextBtn.textContent = labels.finish;
        } else {
            nextBtn.textContent = labels.next;
        }
        nextBtn.disabled = !state.canGoNext;
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
        nextBtn.style.opacity = nextBtn.disabled ? '0.45' : '1';

        // applyTooltipPosition(tooltip, state, theme.highlightPadding);
    };

    const unsubscribe = manager.subscribe(renderState);

    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleViewportChange, { passive: true });
        window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
    }

    return {
        destroy: () => {
            stopObserver();
            unsubscribe();
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleViewportChange);
                window.removeEventListener('scroll', handleViewportChange, { capture: true });
            }
            if (root.parentElement) {
                root.parentElement.removeChild(root);
            }
            mountedInDom = false;
        }
    };
}