/**
 * Export the framework-agnostic tour engine, storage helpers, DOM target observer,
 * default theme utilities, and TypeScript types for use in any
 * TypeScript or JavaScript project
 */
export {
    DEFAULT_TOUR_THEME,
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
    StartTourOptions,
    StoredTourState,
    TargetBox,
    ThemeDumpFormat,
    TooltipPlacement,
    TourConfig,
    TourListener,
    TourManagerOptions,
    TourSection,
    TourSectionContent,
    TourTheme
} from './types';