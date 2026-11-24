// Makes sure only one copy of the extension runs.
//
// The same build is published to the Marketplace and used as a local install:
//   - local installs (`spicetify config extensions ...`) are served from https://xpui.app.spotify.com/
//   - Marketplace installs are loaded from a CDN (cdn.jsdelivr.net)
// If both are installed, the local copy wins: the Marketplace copy either exits right away or, if it started
// first, gets destroyed by the local one. Between two copies of the same kind, the first one to start wins.
//
// The active instance is published as `window.SimpleBeautifulLyrics` (also handy for debugging in DevTools).

import { Log } from "./Log";

/** `nameId` from settings.json - also the name of the built file. */
const NameId = "simple-beautiful-lyrics";

/** Id of the <style> element spicetify-creator injects: its `globalName`, i.e. `nameId` with every "-" replaced by "D". */
export const StyleElementId = NameId.replace(/-/g, "D");

const ScriptFileName = `${NameId}.js`;
const LocalOrigin = "https://xpui.app.spotify.com/";

export interface InstanceHandle {
    /** True when this copy was loaded from the local Spicetify extensions folder. */
    readonly isLocal: boolean;
    /** URL this copy was loaded from (undefined if it could not be detected). */
    readonly source?: string;
    /** Stops this copy and removes everything it added to the page. */
    destroy(): void;
    /** Returns a JSON-serialisable report about the current state (set once the extension started). */
    diagnose?: () => unknown;
}

declare global {
    interface Window {
        SimpleBeautifulLyrics?: InstanceHandle;
    }
}

/**
 * Finds the URL of the script that is executing this code.
 * spicetify-creator wraps the bundle in async functions, so `document.currentScript` is usually null by now.
 * The stack trace still contains the URL of the file the current code lives in.
 */
const detectOwnSource = (): string | undefined => {
    const current = (document.currentScript as HTMLScriptElement | null)?.src;
    if (current?.includes(ScriptFileName)) return current;

    const stack = new Error().stack ?? "";
    const match = stack.match(/(?:https?|blob|file):[^\s)]*?simple-beautiful-lyrics\.js/);
    return match?.[0];
};

/** True if a local copy of the extension is part of the page (even if it has not started yet). */
const hasLocalScriptTag = (): boolean => {
    for (const script of document.getElementsByTagName("script")) {
        if (script.src.startsWith(LocalOrigin) && script.src.includes(ScriptFileName)) return true;
    }
    return false;
};

/**
 * Registers this copy as the active instance.
 * Must be called synchronously at startup, before the first `await`, so the decision is made in load order.
 *
 * @param destroy cleans up everything this copy added - called if a local copy takes over later
 * @returns the handle when this copy should run, otherwise undefined
 */
export const claimInstance = (destroy: () => void): InstanceHandle | undefined => {
    const source = detectOwnSource();
    const isLocal = source?.startsWith(LocalOrigin) ?? false;
    const existing = window.SimpleBeautifulLyrics;

    if (existing !== undefined) {
        if (!isLocal || existing.isLocal) {
            Log.info(`Another instance is already running (${existing.source ?? "unknown source"}), this one (${source ?? "unknown source"}) stays idle.`);
            return undefined;
        }

        Log.info(`Local instance takes over from ${existing.source ?? "unknown source"}.`);
        existing.destroy();
        // Remove the other copy's stylesheet so spicetify-creator injects ours right after startup
        document.getElementById(StyleElementId)?.remove();
    } else if (source !== undefined && !isLocal && hasLocalScriptTag()) {
        // We positively know we are not the local copy, and a local copy exists - let it run instead.
        // (If our own source is unknown we never skip, otherwise a local copy could disable itself.)
        Log.info("A local instance is installed, the Marketplace instance stays idle.");
        return undefined;
    }

    const handle: InstanceHandle = { isLocal, source, destroy };
    window.SimpleBeautifulLyrics = handle;
    Log.info(`Running as the ${isLocal ? "local" : "Marketplace"} instance (${source ?? "unknown source"}).`);
    return handle;
};

/** False once another copy took over. Check this after every `await` during startup. */
export const isActiveInstance = (handle: InstanceHandle): boolean => window.SimpleBeautifulLyrics === handle;
