/**
 * Tour class represents a guided tour configuration for a web application
 * This class wraps a TourConfig or plain JSON definition,
 * validates required fields, and exposes ordered section
 * keys and lookup helpers.
 */
import type { TourConfig, TourSection } from './types';

export class Tour {
    readonly name: string;
    readonly autoStart: boolean;
    readonly triggerEvent: string | undefined;
    readonly nextTour: string | undefined;
    readonly targetGraceMs: number | undefined;
    readonly showRestartButton: boolean;
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

        const normalizedSections: Record<string, TourSection> = {};
        for (const key of keys) {
            const section = config.sections[key];
            normalizedSections[key] = {
                elements: Array.isArray(section.elements) ? [...section.elements] : [],
                content: {
                    title: section.content.title,
                    content: section.content.content,
                    description: section.content.description
                },
                targetGraceMs: section.targetGraceMs
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