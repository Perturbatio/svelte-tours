/**
 * Export the framework-agnostic tour engine, storage helpers, DOM target observer,
 * default theme utilities, and TypeScript types for use in any
 * TypeScript or JavaScript project
 */
export {
    DEFAULT_NAV_CONTROLS,
    DEFAULT_NAV_LABELS,
    DEFAULT_TOUR_THEME,
    resolveTourNavControls,
    resolveTourNavLabels,
    resolveTourTheme,
    themeToCssVariables
} from './defaultTheme';

export {
    mountTourDom,
    type DomTourMountController,
    type DomTourMountOptions
} from './domMount';

export {
    observeSectionTargets,
    resolveTargetBoxes,
    type ObserveTargetsOptions,
    type TargetObserverController,
    type TargetResolutionResult
} from './domObserver';

export {
    createDefaultTourState,
    DEFAULT_STORAGE_KEY,
    getTourState,
    loadAllTourStates,
    resetTourState,
    saveAllTourStates,
    updateTourState
} from './storage';

export {isTourInstance, Tour, toTourInstance} from './Tour';
export {TourManager, tours} from './TourManager';

export type {
    ActiveSectionState,
    NavButtonActionContext,
    NavButtonContext,
    ResolvedTourNavControls,
    ResolvedTourNavLabels,
    StartTourOptions,
    StepCounterContext,
    StoredTourState,
    TargetBox,
    ThemeDumpFormat,
    TooltipPlacement,
    TourConfig,
    TourListener,
    TourManagerOptions,
    TourNavControls,
    TourNavLabels,
    TourNavPlacement,
    TourSection,
    TourSectionContent,
    TourTheme
} from './types';