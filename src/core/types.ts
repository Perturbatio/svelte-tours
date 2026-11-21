/**
 * These types define tour definitions, nextTour chaining, grace periods, target bounding rectangles, localStorage state, theme keys, and the manager API.
 */
export type TourNavPlacement = 'tooltip' | 'top' | 'bottom';

export interface TourNavLabels {
    /** Label for the previous button. Defaults to 'Previous'. */
    previous?: string;
    /** Alias for previous. */
    prev?: string;
    /** Label for the next button. Defaults to 'Next'. */
    next?: string;
    /** Label for the next button on the last step when chained to another tour. Defaults to 'Next Tour'. */
    nextTour?: string;
    /** Label for the next button on the last step of the final tour. */
    finish?: string;
    /** Alias for finish. */
    done?: string;
    /** Alias for finish. */
    complete?: string;
    /** Label for the restart button. Defaults to 'Restart Tour'. */
    restart?: string;
    /** Alias for restart. */
    restartTour?: string;
    /** Label for the close button. Defaults to 'Close'. */
    close?: string;
    /** ARIA label for the close button. Defaults to 'Close tour'. */
    closeAriaLabel?: string;
    /** ARIA label for the navigation bar container. Defaults to 'Tour navigation'. */
    navAriaLabel?: string;
}

export interface ResolvedTourNavLabels {
    previous: string;
    next: string;
    nextTour: string;
    finish?: string;
    restart: string;
    close: string;
    closeAriaLabel: string;
    navAriaLabel: string;
}

export interface TourSectionContent {
    title: string;
    content?: string;
    description?: string;
    /** Optional navigation button labels override for this section. */
    labels?: TourNavLabels;
}

export interface TourSection {
    /** CSS selectors for one or more target elements to highlight. */
    elements: string[];
    content: TourSectionContent;
    /** Optional grace period (ms) to wait for missing targets in this section. */
    targetGraceMs?: number;
    /** Navigation bar placement override for this section. */
    navPlacement?: TourNavPlacement;
    /** Optional navigation button labels override for this section. */
    labels?: TourNavLabels;
    /** Alias for labels. */
    navLabels?: TourNavLabels;
}

export interface TourConfig {
    name: string;
    autoStart?: boolean;
    /** Custom event name that starts this tour when dispatched. */
    triggerEvent?: string;
    /** Name of a tour to start automatically when clicking Next on the last section. */
    nextTour?: string;
    /** Default grace period (ms) to wait for target elements before top-center fallback. */
    targetGraceMs?: number;
    /** Shows an optional button that resets stored state and restarts the tour. */
    showRestartButton?: boolean;
    /** Navigation bar placement for this tour. */
    navPlacement?: TourNavPlacement;
    /** Navigation button labels for this tour. */
    labels?: TourNavLabels;
    /** Alias for labels. */
    navLabels?: TourNavLabels;
    sections: Record<string, TourSection>;
}

export interface StoredTourState {
    dismissed: boolean;
    completed: boolean;
    lastSectionKey: string | null;
}

/**
 * Represents a bounding box of an element.
 */
export interface TargetBox {
    selector: string;
    rect: {
        top: number;
        left: number;
        width: number;
        height: number;
        right: number;
        bottom: number;
    };
}

export type TooltipPlacement = 'anchored' | 'top-center';

export interface ActiveSectionState {
    tourName: string;
    sectionKey: string;
    sectionIndex: number;
    totalSections: number;
    section: TourSection;
    targets: TargetBox[];
    anchorRect: TargetBox['rect'] | null;
    placement: TooltipPlacement;
    navPlacement: TourNavPlacement;
    labels: ResolvedTourNavLabels;
    canGoPrevious: boolean;
    canGoNext: boolean;
    hasNextTour: boolean;
    showRestartButton: boolean;
    stepId: number;
}

export interface TourTheme {
    maskBgColor: string;
    maskTransparency: number;
    highlightPadding: number;
    highlightRadius: number;
    tipBgColor: string;
    tipTextColor: string;
    tipTitleColor: string;
    tipBorderRadius: string;
    tipBorderColor: string;
    tipBorderWidth: string;
    tipShadow: string;
    tipMaxWidth: string;
    tooltipExtraClasses?: string;
    buttonBgColor: string;
    buttonTextColor: string;
    zIndex: number;
    labels?: TourNavLabels;
    navLabels?: TourNavLabels;
    navPlacement?: TourNavPlacement;
    navBgColor?: string;
    navTextColor?: string;
    navBorderColor?: string;
    navBorderWidth?: string;
    navPadding?: string;
    navHeight?: string;
    navLeft?: string;
    navRight?: string;
}

export type ThemeDumpFormat = 'json' | 'js' | 'ts';

export interface StartTourOptions {
    resume?: boolean;
}

export interface TourManagerOptions {
    storageKey?: string;
    defaultTargetGraceMs?: number;
    eventTarget?: EventTarget;
}

export type TourListener = (state: ActiveSectionState | null) => void;