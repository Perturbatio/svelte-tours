/**
 * This class manages registered tours, enforces a single active tour at any time,
 * handles nextTour chaining, listens for optional custom trigger events,
 * and updates localStorage state for auto-start, close, resume, and restart
 */
import {
    DEFAULT_TOUR_THEME,
    resolveTourNavLabels,
    resolveTourTheme,
    themeToCssVariables
} from './defaultTheme';
import {
    DEFAULT_STORAGE_KEY,
    getTourState,
    resetTourState,
    updateTourState
} from './storage';
import { Tour, toTourInstance } from './Tour';
import type {
    ActiveSectionState,
    StartTourOptions,
    TargetBox,
    TooltipPlacement,
    TourConfig,
    TourListener,
    TourManagerOptions,
    TourSection,
    TourTheme
} from './types';

interface ActiveSession {
    tour: Tour;
    sectionIndex: number;
    targets: TargetBox[];
    placement: TooltipPlacement;
    stepId: number;
}

export class TourManager {
    private readonly tours = new Map<string, Tour>();
    private readonly listeners = new Set<TourListener>();
    private readonly eventCleanups = new Map<string, () => void>();
    private readonly storageKey: string;
    private readonly defaultTargetGraceMs: number;
    private readonly eventTarget: EventTarget | null;

    private theme: TourTheme = { ...DEFAULT_TOUR_THEME };
    private activeSession: ActiveSession | null = null;
    private stepSequence = 0;

    constructor(options: TourManagerOptions = {}) {
        this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
        this.defaultTargetGraceMs = options.defaultTargetGraceMs ?? 1000;
        this.eventTarget =
            options.eventTarget ?? (typeof globalThis !== 'undefined' && 'addEventListener' in globalThis
                ? (globalThis as unknown as EventTarget)
                : null);
    }

    subscribe(listener: TourListener): () => void {
        this.listeners.add(listener);
        listener(this.getActiveState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    setTheme(customTheme: Partial<TourTheme>): TourTheme {
        this.theme = resolveTourTheme({
            ...this.theme,
            ...customTheme
        });
        this.emit();
        return this.getTheme();
    }

    getTheme(): TourTheme {
        return { ...this.theme };
    }

    getThemeCssVariables(): Record<string, string> {
        return themeToCssVariables(this.theme);
    }

    addTour(input: Tour | TourConfig): Tour {
        const tour = toTourInstance(input);
        this.tours.set(tour.name, tour);
        this.bindTriggerEvent(tour);

        if (tour.autoStart) {
            const state = getTourState(tour.name, this.storageKey);
            if (!state.dismissed && !state.completed) {
                this.start(tour.name, { resume: true });
            }
        }

        return tour;
    }

    getTour(name: string): Tour | undefined {
        return this.tours.get(name);
    }

    start(name: string, options: StartTourOptions = {}): boolean {
        // console.log(`TourManager: Starting tour "${name}" with options:`, options);
        const tour = this.tours.get(name);
        if (!tour) {
            console.warn(`TourManager: Tour "${name}" not found.`);
            return false;
        }

        // Stop any currently active tour so only one tour runs at a time.
        this.activeSession = null;

        const state = getTourState(tour.name, this.storageKey);
        const shouldResume = options.resume !== false && state.lastSectionKey !== null;
        const savedIndex = shouldResume && state.lastSectionKey
            ? tour.getIndex(state.lastSectionKey)
            : -1;
        const startIndex = savedIndex >= 0 ? savedIndex : 0;

        return this.activateSection(tour, startIndex);
    }

    next(): boolean {
        if (!this.activeSession) {
            return false;
        }

        const { tour, sectionIndex } = this.activeSession;
        const nextIndex = sectionIndex + 1;

        if (nextIndex < tour.sectionKeys.length) {
            return this.activateSection(tour, nextIndex);
        }

        // Reached the end of the active tour.
        updateTourState(
            tour.name,
            {
                completed: true,
                dismissed: false,
                lastSectionKey: null
            },
            this.storageKey
        );

        const chainedTourName = tour.nextTour;
        this.activeSession = null;

        if (chainedTourName && this.tours.has(chainedTourName)) {
            return this.start(chainedTourName, { resume: false });
        }

        this.emit();
        return false;
    }

    previous(): boolean {
        if (!this.activeSession) {
            return false;
        }

        const prevIndex = this.activeSession.sectionIndex - 1;
        if (prevIndex < 0) {
            return false;
        }

        return this.activateSection(this.activeSession.tour, prevIndex);
    }

    close(): void {
        if (!this.activeSession) {
            return;
        }

        const { tour, sectionIndex } = this.activeSession;
        const currentKey = tour.getKeyAt(sectionIndex) ?? null;

        updateTourState(
            tour.name,
            {
                dismissed: true,
                lastSectionKey: currentKey
            },
            this.storageKey
        );

        this.activeSession = null;
        this.emit();
    }

    restart(name?: string): boolean {
        const targetName = name ?? this.activeSession?.tour.name;
        if (!targetName || !this.tours.has(targetName)) {
            return false;
        }

        resetTourState(targetName, this.storageKey);
        return this.start(targetName, { resume: false });
    }

    setSectionTargets(targets: TargetBox[], placement?: TooltipPlacement): void {
        if (!this.activeSession) {
            return;
        }

        this.activeSession.targets = targets;
        this.activeSession.placement = placement ?? (targets.length > 0 ? 'anchored' : 'top-center');
        this.emit();
    }

    getGracePeriodMs(section?: TourSection): number {
        if (section?.targetGraceMs !== undefined) {
            return section.targetGraceMs;
        }
        if (this.activeSession?.tour.targetGraceMs !== undefined) {
            return this.activeSession.tour.targetGraceMs;
        }
        return this.defaultTargetGraceMs;
    }

    getActiveState(): ActiveSectionState | null {
        if (!this.activeSession) {
            return null;
        }

        const { tour, sectionIndex, targets, placement } = this.activeSession;
        const sectionKey = tour.getKeyAt(sectionIndex);
        if (!sectionKey) {
            return null;
        }

        const section = tour.sections[sectionKey];
        const hasNextSection = sectionIndex < tour.sectionKeys.length - 1;
        const hasNextTour = Boolean(tour.nextTour);
        const navPlacement = section.navPlacement ?? tour.navPlacement ?? this.theme.navPlacement ?? 'tooltip';
        const labels = resolveTourNavLabels(
            this.theme.labels ?? this.theme.navLabels,
            tour.labels,
            section.labels ?? section.navLabels ?? section.content?.labels
        );

        return {
            tourName: tour.name,
            sectionKey,
            sectionIndex,
            totalSections: tour.sectionKeys.length,
            section,
            targets,
            anchorRect: targets.length > 0 ? targets[0].rect : null,
            placement,
            navPlacement,
            labels,
            canGoPrevious: sectionIndex > 0,
            canGoNext: hasNextSection || hasNextTour,
            hasNextTour,
            showRestartButton: tour.showRestartButton,
            stepId: this.activeSession.stepId
        };
    }

    destroy(): void {
        this.activeSession = null;
        for (const cleanup of this.eventCleanups.values()) {
            cleanup();
        }
        this.eventCleanups.clear();
        this.listeners.clear();
        this.emit();
    }

    private activateSection(tour: Tour, sectionIndex: number): boolean {
        const sectionKey = tour.getKeyAt(sectionIndex);
        if (!sectionKey) {
            console.warn(`TourManager: Section "${sectionKey}" not found in tour "${tour.name}"`);
            return false;
        }

        updateTourState(
            tour.name,
            {
                completed: false,
                lastSectionKey: sectionKey
            },
            this.storageKey
        );

        this.stepSequence += 1;
        this.activeSession = {
            tour,
            sectionIndex,
            targets: [],
            placement: 'top-center',
            stepId: this.stepSequence
        };

        this.emit();
        return true;
    }

    private bindTriggerEvent(tour: Tour): void {
        if (!tour.triggerEvent || !this.eventTarget) {
            return;
        }

        const existing = this.eventCleanups.get(tour.name);
        if (existing) {
            existing();
        }

        const handler = () => {
            this.start(tour.name, { resume: true });
        };

        this.eventTarget.addEventListener(tour.triggerEvent, handler);
        this.eventCleanups.set(tour.name, () => {
            this.eventTarget?.removeEventListener(tour.triggerEvent!, handler);
        });
    }

    private emit(): void {
        const state = this.getActiveState();
        for (const listener of this.listeners) {
            listener(state);
        }
    }
}

export const tours = new TourManager();