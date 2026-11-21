/**
 * These types define tour definitions, nextTour chaining, grace periods, target bounding rectangles, localStorage state, theme keys, and the manager API.
 */
export type TourNavPlacement = 'tooltip' | 'top' | 'bottom';

export interface TourSectionContent {
    title: string;
    content?: string;
    description?: string;
}

export interface TourSection {
    /** CSS selectors for one or more target elements to highlight. */
    elements: string[];
    content: TourSectionContent;
    /** Optional grace period (ms) to wait for missing targets in this section. */
    targetGraceMs?: number;
    /** Navigation bar placement override for this section. */
    navPlacement?: TourNavPlacement;
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
    canGoPrevious: boolean;
    canGoNext: boolean;
    hasNextTour: boolean;
    showRestartButton: boolean;
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