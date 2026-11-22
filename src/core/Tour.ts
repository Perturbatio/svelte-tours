/**
 * Tour class represents a guided tour configuration for a web application
 * This class wraps a TourConfig or plain JSON definition,
 * validates required fields, and exposes ordered section
 * keys and lookup helpers.
 */
import type { TourConfig, TourNavControls, TourNavLabels, TourNavPlacement, TourSection } from './types';

function extractControls(obj: any): TourNavControls | undefined {
    if (!obj) return undefined;
    const directControls = obj.controls ?? obj.navControls;
    const flatControls: TourNavControls = {};
    let hasFlat = false;
    if (obj.showPrevious !== undefined) { flatControls.showPrevious = obj.showPrevious; hasFlat = true; }
    if (obj.showPrev !== undefined) { flatControls.showPrev = obj.showPrev; hasFlat = true; }
    if (obj.showNext !== undefined) { flatControls.showNext = obj.showNext; hasFlat = true; }
    if (obj.showClose !== undefined) { flatControls.showClose = obj.showClose; hasFlat = true; }
    if (obj.showRestart !== undefined) { flatControls.showRestart = obj.showRestart; hasFlat = true; }
    if (obj.showRestartButton !== undefined) { flatControls.showRestartButton = obj.showRestartButton; hasFlat = true; }
    if (obj.showStepCounter !== undefined) { flatControls.showStepCounter = obj.showStepCounter; hasFlat = true; }
    if (obj.showCounter !== undefined) { flatControls.showCounter = obj.showCounter; hasFlat = true; }

    if (directControls && hasFlat) {
        return { ...directControls, ...flatControls };
    }
    return directControls ?? (hasFlat ? flatControls : undefined);
}

export class Tour {
    readonly name: string;
    readonly autoStart: boolean;
    readonly triggerEvent: string | undefined;
    readonly nextTour: string | undefined;
    readonly targetGraceMs: number | undefined;
    readonly showRestartButton: boolean;
    readonly navPlacement: TourNavPlacement | undefined;
    readonly labels: TourNavLabels | undefined;
    readonly controls: TourNavControls | undefined;
    readonly sections: Record<string, TourSection>;
    readonly sectionKeys: string[];

    constructor(config: TourConfig) {
        if (!config.name || config.name.trim() === '') {
            throw new Error('Tour name must not be empty.');
        }

        const keys = Object.keys(config.sections ?? {});
        if (keys.length === 0) {
            throw new Error(`Tour "${config.name}" must define at least one section.`);
        }

        this.name = config.name;
        this.autoStart = Boolean(config.autoStart);
        this.triggerEvent = config.triggerEvent;
        this.nextTour = config.nextTour;
        this.targetGraceMs = config.targetGraceMs;
        this.showRestartButton = Boolean(config.showRestartButton);
        this.navPlacement = config.navPlacement;
        this.labels = config.labels ?? config.navLabels;
        this.controls = extractControls(config);

        const normalizedSections: Record<string, TourSection> = {};
        for (const key of keys) {
            const section = config.sections[key];
            const sectionLabels = section.labels ?? section.navLabels ?? section.content?.labels;
            const sectionControls = extractControls(section) ?? extractControls(section.content);
            normalizedSections[key] = {
                elements: Array.isArray(section.elements) ? [...section.elements] : [],
                content: {
                    title: section.content.title,
                    content: section.content.content,
                    description: section.content.description,
                    labels: sectionLabels,
                    controls: sectionControls
                },
                targetGraceMs: section.targetGraceMs,
                navPlacement: section.navPlacement,
                labels: sectionLabels,
                navLabels: sectionLabels,
                controls: sectionControls,
                navControls: sectionControls
            };
        }

        this.sections = normalizedSections;
        this.sectionKeys = keys;
    }

    hasSection(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.sections, key);
    }

    getSection(key: string): TourSection | undefined {
        return this.hasSection(key) ? this.sections[key] : undefined;
    }

    getIndex(key: string): number {
        return this.sectionKeys.indexOf(key);
    }

    getKeyAt(index: number): string | undefined {
        return this.sectionKeys[index];
    }
}

export function isTourInstance(value: Tour | TourConfig): value is Tour {
    return value instanceof Tour;
}

export function toTourInstance(input: Tour | TourConfig): Tour {
    return isTourInstance(input) ? input : new Tour(input);
}