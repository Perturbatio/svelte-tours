/**
 * This module defines the default TourTheme values, merges custom theme overrides,
 * and formats the theme as CSS custom properties (--pt-*)
 **/
import type {TourTheme} from './types';

export const DEFAULT_TOUR_THEME: Readonly<TourTheme> = Object.freeze({
    maskBgColor: '#000000',
    maskTransparency: 0.6,
    highlightPadding: 6,
    highlightRadius: 6,
    tipBgColor: '#ffffff',
    tipTextColor: '#111827',
    tipTitleColor: '#000000',
    tipBorderRadius: '8px',
    tipShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    tipMaxWidth: '360px',
    buttonBgColor: '#2563eb',
    buttonTextColor: '#ffffff',
    zIndex: 9999
});

export function resolveTourTheme(customTheme?: Partial<TourTheme>): TourTheme {
    return {
        ...DEFAULT_TOUR_THEME,
        ...customTheme
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
        '--pt-z-index': String(theme.zIndex)
    };
}