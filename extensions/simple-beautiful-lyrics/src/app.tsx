// Simple Beautiful Lyrics - entry point.
//
// Startup:
//   1. claim the instance (synchronously, before any await - see core/Instance.ts)
//   2. wait for Spicetify
//   3. start the features and watch the DOM: whenever the page changes, the lyrics elements are detected again
//      (at most once per animation frame) and handed to the features.

import { claimInstance, InstanceHandle, isActiveInstance, StyleElementId } from "./core/Instance";
import { Log } from "./core/Log";
import { Scope } from "./core/Scope";
import { getSpotifyVersion, waitForSpicetify } from "./core/Spicetify";
import { findContainerCandidates, findLyricsElements, getLyricLines, LyricsElements } from "./dom/Detection";
import { LineClasses } from "./dom/LineClasses";
import { Background } from "./features/Background";
import { CoverArt } from "./features/CoverArt";
import { DetectionMenu } from "./features/DetectionMenu";
import { LyricsEffects } from "./features/LyricsEffects";

/** Short description of an element for the diagnostics report. */
const describeElement = (element: Element | null | undefined) =>
    element
        ? {
              tag: element.tagName.toLowerCase(),
              classes: Array.from(element.classList),
              children: element.childElementCount,
              connected: element.isConnected
          }
        : null;

class Extension {
    private elements: LyricsElements | null = null;
    private frame = 0;
    private refreshErrors = 0;

    private readonly background: Background;
    private readonly lyrics: LyricsEffects;

    constructor(
        private readonly scope: Scope,
        private readonly instance: InstanceHandle
    ) {
        const coverArt = new CoverArt(scope);
        this.background = new Background(scope, coverArt);
        this.lyrics = new LyricsEffects(scope);
        new DetectionMenu(
            scope,
            () => {
                this.lyrics.refresh();
                this.refresh();
            },
            () => this.diagnose()
        );

        // Coalesce DOM changes into one refresh per animation frame
        scope.observer(new MutationObserver(() => this.scheduleRefresh())).observe(document.body, { childList: true, subtree: true });
        scope.add(() => cancelAnimationFrame(this.frame));

        // A song change can swap the lyrics without other DOM changes we would notice
        const onSongChange = () => this.scheduleRefresh();
        Spicetify.Player.addEventListener("songchange", onSongChange);
        scope.add(() => Spicetify.Player.removeEventListener("songchange", onSongChange));

        this.refresh();
    }

    private scheduleRefresh(): void {
        if (this.frame !== 0) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = 0;
            this.refresh();
        });
    }

    /** Detects the lyrics elements and passes them to the features. */
    private refresh(): void {
        try {
            this.elements = findLyricsElements();
            this.background.update(this.elements);
            this.lyrics.update(this.elements?.host ?? null, this.elements?.content ?? null);
        } catch (error) {
            // Log the first few failures only - refresh runs on every DOM change
            if (this.refreshErrors++ < 5) Log.error("Refresh failed:", error);
        }
    }

    /** JSON-serialisable snapshot of everything relevant for debugging. */
    diagnose() {
        const host = this.elements?.host;
        const lines = host ? getLyricLines(host) : [];

        return {
            extension: { isLocal: this.instance.isLocal, source: this.instance.source, refreshErrors: this.refreshErrors },
            spotify: getSpotifyVersion(),
            styleInjected: (document.getElementById(StyleElementId)?.textContent ?? "").includes("data-sbl-line"),
            containerCandidates: findContainerCandidates().map(describeElement),
            elements: {
                container: describeElement(this.elements?.container),
                spotifyBackground: describeElement(this.elements?.spotifyBackground),
                content: describeElement(this.elements?.content),
                host: describeElement(host),
                cinema: describeElement(this.elements?.cinema)
            },
            lines: lines.map((line) => ({ classes: Array.from(line.classList), state: line.getAttribute("data-sbl-state"), length: line.textContent?.length ?? 0 })),
            lyrics: this.lyrics.describe(),
            background: this.background.describe(),
            learnedLineClasses: LineClasses.snapshot(),
            log: Log.history()
        };
    }
}

async function main() {
    const scope = new Scope();

    // Must happen before the first await (load order decides between local and Marketplace copies)
    const instance = claimInstance(() => scope.clean());
    if (!instance) return;

    await waitForSpicetify();

    // A local copy may have taken over while we were waiting
    if (!isActiveInstance(instance)) return;

    try {
        const extension = new Extension(scope, instance);
        instance.diagnose = () => extension.diagnose();
    } catch (error) {
        Log.error("Startup failed:", error);
        scope.clean();
    }
}

export default main;
