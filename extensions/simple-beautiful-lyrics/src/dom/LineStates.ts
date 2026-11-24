// Works out the state of every lyric line from the classes Spotify puts on them.
//
// The hashes change between Spotify versions, but the layout does not: exactly one line carries a class no
// other line has (active), all lines before it share one class (sung) and all lines after it share another
// one (unsung). Detecting that boundary needs no hard-coded names - and once found, the classes are learned
// (LineClasses.ts) so the next checks are a simple class lookup.

import { LineClasses } from "./LineClasses";

export type LyricState = "Active" | "Sung" | "Unsung" | "Unsynced";

export interface LineStates {
    states: LyricState[];
    /** Index of the active line, -1 if there is none (intro, outro or unsynced lyrics). */
    activeIndex: number;
}

const classesOf = (element: Element): string[] => Array.from(element.classList);

/** Classes present on every given class list. */
const intersect = (lists: string[][]): Set<string> => {
    if (lists.length === 0) return new Set();
    let result = new Set(lists[0]);
    for (let i = 1; i < lists.length && result.size > 0; i++) {
        const next = new Set(lists[i]);
        result = new Set([...result].filter((c) => next.has(c)));
    }
    return result;
};

/**
 * Finds the active line purely from the class layout (see the file header). Learns the classes on success.
 * Returns -1 when the layout does not show a clear boundary.
 */
const inferActiveLine = (lines: Element[]): number => {
    if (lines.length < 2) return -1;

    const base = intersect(lines.map(classesOf));
    const roles = lines.map((line) => classesOf(line).filter((c) => !base.has(c)));

    // Where does each non-base class occur?
    const occurrences = new Map<string, number[]>();
    roles.forEach((classes, index) => {
        for (const className of classes) {
            const indices = occurrences.get(className);
            if (indices) indices.push(index);
            else occurrences.set(className, [index]);
        }
    });

    for (const [candidate, indices] of occurrences) {
        if (indices.length !== 1) continue;
        const index = indices[0];

        const before = index > 0 ? intersect(roles.slice(0, index)) : undefined;
        const after = index < lines.length - 1 ? intersect(roles.slice(index + 1)) : undefined;

        // Every line before/after must share a class...
        if (before?.size === 0 || after?.size === 0) continue;
        // ...the two groups must be different...
        if (before && after && [...before].some((c) => after.has(c))) continue;
        // ...and the active line must not belong to either group (rules out e.g. a single empty "♪" line).
        if ([...(before ?? []), ...(after ?? [])].some((c) => roles[index].includes(c))) continue;

        if (base.size === 1) LineClasses.learn("Line", [...base][0]);
        LineClasses.learn("Active", candidate);
        if (before?.size === 1) LineClasses.learn("Sung", [...before][0]);
        if (after?.size === 1) LineClasses.learn("Unsung", [...after][0]);
        return index;
    }

    return -1;
};

/**
 * Remembers the class shared by all lines of unsynced lyrics.
 * Only done once the synced classes are known for this Spotify version - otherwise the intro of a synced song
 * (every line "unsung") would look exactly like unsynced lyrics.
 */
const learnUnsyncedClass = (lines: Element[]) => {
    if (lines.length < 2 || LineClasses.learned("Sung").length === 0 || LineClasses.learned("Unsung").length === 0) return;

    const known = new Set([...LineClasses.get("Line"), ...LineClasses.get("Sung"), ...LineClasses.get("Unsung")]);
    const shared = [...intersect(lines.map(classesOf))].filter((c) => !known.has(c));
    if (shared.length === 1) LineClasses.learn("Unsynced", shared[0]);
};

export const resolveLineStates = (lines: Element[]): LineStates => {
    const states = new Array<LyricState>(lines.length).fill("Unsung");

    let activeIndex = lines.findIndex((line) => LineClasses.matches(line, "Active"));
    if (activeIndex === -1) activeIndex = inferActiveLine(lines);

    if (activeIndex !== -1) {
        for (let i = 0; i < lines.length; i++) {
            states[i] = i < activeIndex ? "Sung" : i === activeIndex ? "Active" : "Unsung";
        }
        return { states, activeIndex };
    }

    // No active line: intro (all unsung), outro (all sung) or unsynced lyrics
    let hasUnknown = false;
    lines.forEach((line, i) => {
        if (LineClasses.matches(line, "Unsynced")) states[i] = "Unsynced";
        else if (LineClasses.matches(line, "Sung")) states[i] = "Sung";
        else if (LineClasses.matches(line, "Unsung")) states[i] = "Unsung";
        else {
            // Unknown state: show the line fully instead of fading it out
            states[i] = "Unsynced";
            hasUnknown = true;
        }
    });

    if (hasUnknown) learnUnsyncedClass(lines);
    return { states, activeIndex: -1 };
};
