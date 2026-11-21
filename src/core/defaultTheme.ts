/**
 * This module defines the default TourTheme values, merges custom theme overrides,
 * and formats the theme as CSS custom properties (--pt-*)
 **/
import type { ResolvedTourNavLabels, TourNavLabels, TourTheme } from './types';

export const DEFAULT_NAV_LABELS: Readonly<ResolvedTourNavLabels> = Object.freeze({
    previous: 'Previous',
    next: 'Next',
    nextTour: 'Next Tour',
    restart: 'Restart Tour',
    close: 'Close',
    closeAriaLabel: 'Close tour',
    navAriaLabel: 'Tour navigation'
});

export function resolveTourNavLabels(
    ...sources: (TourNavLabels | undefined)[]
): ResolvedTourNavLabels {
    let previous = DEFAULT_NAV_LABELS.previous;
    let next = DEFAULT_NAV_LABELS.next;
    let nextTour = DEFAULT_NAV_LABELS.nextTour;
    let finish = DEFAULT_NAV_LABELS.finish;
    let restart = DEFAULT_NAV_LABELS.restart;
    let close = DEFAULT_NAV_LABELS.close;
    let closeAriaLabel: string | undefined;
    let navAriaLabel = DEFAULT_NAV_LABELS.navAriaLabel;

    for (const src of sources) {
        if (!src) continue;
        if (src.previous !== undefined || src.prev !== undefined) {
            previous = src.previous ?? src.prev!;
        }
        if (src.next !== undefined) {
            next = src.next;
        }
        if (src.nextTour !== undefined) {
            nextTour = src.nextTour;
        }
        if (src.finish !== undefined || src.done !== undefined || src.complete !== undefined) {
            finish = src.finish ?? src.done ?? src.complete;
        }
        if (src.restart !== undefined || src.restartTour !== undefined) {
            restart = src.restart ?? src.restartTour!;
        }
        if (src.close !== undefined) {
            close = src.close;
        }
        if (src.closeAriaLabel !== undefined) {
            closeAriaLabel = src.closeAriaLabel;
        }
        if (src.navAriaLabel !== undefined) {
            navAriaLabel = src.navAriaLabel;
        }
    }

    return {
        previous,
        next,
        nextTour,
        finish,
        restart,
        close,
        closeAriaLabel: closeAriaLabel ?? (close !== 'Close' ? `${close} tour` : DEFAULT_NAV_LABELS.closeAriaLabel),
        navAriaLabel
    };
}

export const DEFAULT_TOUR_THEME: Readonly<TourTheme> = Object.freeze({
    maskBgColor: '#000000',
    maskTransparency: 0.6,
    highlightPadding: 6,
    highlightRadius: 6,
    tipBgColor: '#ffffff',
    tipTextColor: '#111827',
    tipTitleColor: '#000000',
    tipBorderRadius: '8px',
    tipBorderColor: '#e5e7eb',
    tipBorderWidth: '1px',
    tipShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    tipMaxWidth: '360px',
    buttonBgColor: '#2563eb',
    buttonTextColor: '#ffffff',
    zIndex: 9999,
    labels: { ...DEFAULT_NAV_LABELS },
    navPlacement: 'tooltip',
    navBgColor: '#ffffff',
    navTextColor: '#111827',
    navBorderColor: '#e5e7eb',
    navBorderWidth: '1px',
    navPadding: '12px 24px',
    navHeight: 'auto',
    navLeft: 'auto',
    navRight: 'auto'
});

export function resolveTourTheme(customTheme?: Partial<TourTheme>): TourTheme {
    return {
        ...DEFAULT_TOUR_THEME,
        ...customTheme,
        labels: customTheme?.labels || customTheme?.navLabels
            ? resolveTourNavLabels(DEFAULT_NAV_LABELS, customTheme.labels ?? customTheme.navLabels)
            : DEFAULT_TOUR_THEME.labels
    };
}

export function themeToCssVariables(theme: TourTheme): Record<string, string> {
    return {
        '--pt-mask-bg-color': theme.maskBgColor,
        '--pt-mask-transparency': String(theme.maskTransparency),
        '--pt-highlight-padding': `${theme.highlightPadding}px`,
        '--pt-highlight-radius': `${theme.highlightRadius}px`,
        '--pt-tip-bg-color': theme.tipBgColor,
        '--pt-tip-text-color': theme.tipTextColor,
        '--pt-tip-title-color': theme.tipTitleColor,
        '--pt-tip-border-radius': theme.tipBorderRadius,
        '--pt-tip-shadow': theme.tipShadow,
        '--pt-tip-max-width': theme.tipMaxWidth,
        '--pt-button-bg-color': theme.buttonBgColor,
        '--pt-button-text-color': theme.buttonTextColor,
        '--pt-z-index': String(theme.zIndex),
        '--pt-tip-border-color': theme.tipBorderColor,
        '--pt-tip-border-width': theme.tipBorderWidth,
        '--pt-nav-bg-color': theme.navBgColor ?? '#ffffff',
        '--pt-nav-text-color': theme.navTextColor ?? '#111827',
        '--pt-nav-border-color': theme.navBorderColor ?? '#e5e7eb',
        '--pt-nav-border-width': theme.navBorderWidth ?? '1px',
        '--pt-nav-padding': theme.navPadding ?? '12px 24px',
        '--pt-nav-height': theme.navHeight ?? 'auto',
        '--pt-nav-left': theme.navLeft ?? 'auto',
        '--pt-nav-right': theme.navRight ?? 'auto'
    };
}