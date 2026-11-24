// Registry of the CSS classes Spotify puts on lyric lines.
//
// Spotify uses hashed CSS-module class names that change with client updates. We never need them for styling
// (our CSS targets our own data-attributes), but they are the only way to tell the state of a line apart.
// Classes are learned at runtime (see LineStates.ts) and cached in localStorage per Spotify version,
// so after an update nothing has to be changed by hand. The defaults are only a warm start.

import { Log } from "../core/Log";
import { getSpotifyVersion } from "../core/Spicetify";

export type LineRole = "Line" | "Active" | "Sung" | "Unsung" | "Unsynced";

/** Last known names: Spicetify's readable name (if it maps it) followed by the hashed name. */
const DefaultClasses: Record<LineRole, string[]> = {
    Line: ["lyrics-lyricsContent-lyric"],
    Active: ["lyrics-lyricsContent-active"],
    Sung: ["lyrics-lyricsContent-previous"],
    Unsung: ["lyrics-lyricsContent-future"],
    Unsynced: ["lyrics-lyricsContent-unsynced"]
};

/** A class can belong to only one of these roles at a time. */
const ExclusiveRoles: LineRole[] = ["Active", "Sung", "Unsung", "Unsynced"];

const StoragePrefix = "sbl:line-classes:";
/** Key prefix used by an earlier development build - removed on load. */
const LegacyStoragePrefix = "sbl:classes:";
const MaxLearnedPerRole = 3;

type Learned = Partial<Record<LineRole, string[]>>;

let learned: Learned | undefined;
let storageKey = "";
const combinedCache = new Map<LineRole, readonly string[]>();

/** Loads the learned classes for the running Spotify version (lazily, Spicetify must be loaded). */
const load = (): Learned => {
    if (learned !== undefined) return learned;

    storageKey = StoragePrefix + getSpotifyVersion();
    try {
        learned = (JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Learned) ?? {};

        // Forget classes learned for other Spotify versions (and leftovers of the old key format)
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key || key === storageKey) continue;
            if (key.startsWith(StoragePrefix) || key.startsWith(LegacyStoragePrefix)) localStorage.removeItem(key);
        }
    } catch {
        learned = {};
    }
    return learned;
};

const save = () => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(learned));
    } catch {
        // Storage unavailable - classes are then only remembered for this session
    }
};

export const LineClasses = {
    /** Classes learned for this Spotify version only (no defaults). */
    learned(role: LineRole): readonly string[] {
        return load()[role] ?? [];
    },

    /** Learned classes followed by the defaults. */
    get(role: LineRole): readonly string[] {
        let classes = combinedCache.get(role);
        if (classes === undefined) {
            classes = [...new Set([...this.learned(role), ...DefaultClasses[role]])];
            combinedCache.set(role, classes);
        }
        return classes;
    },

    /** True if the element has any class known for the role. */
    matches(element: Element, role: LineRole): boolean {
        return this.get(role).some((className) => element.classList.contains(className));
    },

    /** Remembers `className` as the newest class of `role`. */
    learn(role: LineRole, className: string): void {
        const data = load();
        const current = data[role] ?? [];
        if (current[0] === className) return;

        data[role] = [className, ...current.filter((c) => c !== className)].slice(0, MaxLearnedPerRole);
        if (ExclusiveRoles.includes(role)) {
            for (const other of ExclusiveRoles) {
                if (other !== role && data[other]?.includes(className)) data[other] = data[other]!.filter((c) => c !== className);
            }
        }

        combinedCache.clear();
        save();
        Log.info(`Learned the "${role}" line class: ${className}`);
    },

    /** Forgets everything learned for this Spotify version. */
    reset(): void {
        load();
        learned = {};
        combinedCache.clear();
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // ignore
        }
        Log.info("Learned line classes were reset.");
    },

    /** Learned classes for the diagnostics report. */
    snapshot(): Learned {
        return { ...load() };
    }
};
