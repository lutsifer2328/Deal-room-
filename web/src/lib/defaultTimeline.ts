import { TimelineStep } from './types';

export const DEFAULT_TIMELINE: TimelineStep[] = [
    { id: 'step_1', label: 'Onboarding', order: 1 },
    { id: 'step_2', label: 'Documents', order: 2 },
    { id: 'step_3', label: 'Preliminary Contract', order: 3 },
    { id: 'step_4', label: 'Final Review', order: 4 },
    { id: 'step_5', label: 'Closing', order: 5 }
];

export function createDefaultTimeline(): TimelineStep[] {
    return JSON.parse(JSON.stringify(DEFAULT_TIMELINE));
}

export function validateTimeline(timeline: TimelineStep[]): boolean {
    // Must have 3-5 steps
    if (timeline.length < 3 || timeline.length > 5) return false;

    // All steps must have unique IDs
    const ids = timeline.map(s => s.id);
    if (new Set(ids).size !== ids.length) return false;

    // Orders must be sequential 1, 2, 3...
    const sortedTimeline = [...timeline].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedTimeline.length; i++) {
        if (sortedTimeline[i].order !== i + 1) return false;
    }

    return true;
}
