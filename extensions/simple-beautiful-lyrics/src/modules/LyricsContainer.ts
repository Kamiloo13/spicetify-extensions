import Cleanup from "../services/Cleanup";
import Player from "../services/Player";
import { GlobalCleanup } from "../services/Session";
import Spotify from "../services/Spotify";
import Timeout from "../services/Timeout";

import "../styles/lyrics.scss";

const DistanceToMaximumBlur = 4; // Any lyrics beyond this unit of distance away will be at full-blur
const ActiveLyricSizeIncrease = 0.5; // This is measured in rem Units as all Spotify fonts are rendered with them
const ContainerResizeStabilizationTime = 0.25;

const LyricsCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "Lyrics");

interface LyricsData {
    Lyric: HTMLDivElement;
    State: LyricState;
}

// Create our storage for each lyric
const lyrics = new Array<LyricsData>();

// Handle updating our lyrics
let fontSizeInRem = 0;

const UpdateFontStyle = (data: LyricsData, textColor?: string, blur?: number) => {
    // Update our lyric appearance according to our blur and text color
    data.Lyric.style.cssText = `color: transparent; text-shadow: ${
        blur === undefined || textColor === undefined ? data.Lyric.style.textShadow : `0 0 ${blur}px ${textColor}`
    }; font-size: ${data.State === "Active" ? `${fontSizeInRem + ActiveLyricSizeIncrease}rem` : ""};`;
};

const Update = () => {
    // Go through our lyrics and update their states (and also gather our active layout-order)
    let activeLayoutOrder = 0;

    for (let i = 0; i < lyrics.length; i++) {
        const data = lyrics[i];
        const classes = data.Lyric.classList;

        if (Spotify.checkClassNamesMatch(classes, "ActiveLyricClass")) {
            data.State = "Active";
            activeLayoutOrder = i;
        } else if (Spotify.checkClassNamesMatch(classes, "UnsyncedLyricClass")) {
            data.State = "Unsynced";
        } else if (Spotify.checkClassNamesMatch(classes, "HighlightedLyricClass")) {
            data.State = "Sung";
        } else {
            data.State = "Unsung";
        }
    }

    // Go through our lyrics and handle updating their appearance
    for (let i = 0; i < lyrics.length; i++) {
        const data = lyrics[i];
        // Determine if we should be considered active
        const isActive = data.State === "Active";
        const isFocused = isActive || data.State === "Unsynced";

        // Determine our blur
        let blur: number;
        if (isFocused || activeLayoutOrder <= 1) {
            blur = 0;
        } else {
            const distance = Math.min(Math.abs(i - activeLayoutOrder), DistanceToMaximumBlur);
            blur = distance;
        }

        // Determine our text-color
        const textColor = isFocused ? "var(--lyrics-color-active)" : data.State === "Sung" ? "var(--lyrics-color-passed)" : "var(--lyrics-color-inactive)";

        // Update our font-size
        UpdateFontStyle(data, textColor, blur);
    }
};

const getMutationIndex = (mutation: MutationRecord): number => {
    if (mutation.previousSibling) {
        // index = index of previous sibling + 1
        const prev = mutation.previousSibling;
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].Lyric === prev) return i + 1;
        }
    }

    if (mutation.nextSibling) {
        // inserted at index of nextSibling
        const next = mutation.nextSibling;
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].Lyric === next) return i;
        }
    }

    return 0;
};

const handleChildListMutation = (mutation: MutationRecord) => {
    const index = getMutationIndex(mutation);

    // Remove old lyrics
    if (mutation.removedNodes.length > 0) {
        lyrics.splice(index, mutation.removedNodes.length);
    }

    // Insert new lyrics
    if (mutation.addedNodes.length > 0) {
        const inserted: LyricsData[] = [];

        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLDivElement && Spotify.checkClassNamesMatch(node.classList, "LyricClass")) {
                inserted.push({
                    Lyric: node,
                    State: "Unsung"
                });
            }
        }

        if (inserted.length > 0) {
            lyrics.splice(index, 0, ...inserted);
        }
    }
};

const ScanLyrics = (container: HTMLDivElement) => {
    // Clear our lyrics
    lyrics.length = 0;
    for (const node of container.children) {
        if (node instanceof HTMLDivElement && Spotify.checkClassNamesMatch(node.classList, "LyricClass")) {
            // Store our lyric
            lyrics.push({
                Lyric: node,
                State: "Unsung"
            });
        }
    }
};

const ManageLyricsContainer = (container: HTMLDivElement) => {
    let cachedFontSizeInRem = 0;

    const UpdateResize = () => {
        const style = getComputedStyle(container);
        const rootStyle = getComputedStyle(document.documentElement);
        const lyricFontSizeInPixels = parseFloat(style.fontSize);
        const rootFontSizeInPixels = parseFloat(rootStyle.fontSize);

        const newFontSizeInRem = lyricFontSizeInPixels / rootFontSizeInPixels;

        // Only update if value actually changed
        if (newFontSizeInRem !== cachedFontSizeInRem) {
            fontSizeInRem = cachedFontSizeInRem = newFontSizeInRem;
            for (const data of lyrics) {
                UpdateFontStyle(data);
            }
        }
    };

    // Grab our lyrics
    ScanLyrics(container);

    // Create our observer to watch for lyric changes
    let mutNum = 0;
    const lyricObserver = LyricsCleanup.AddObserver(
        new MutationObserver((mutations) => {
            let needsUpdate = false;

            if (mutNum > 5) {
                // After a few mutations, re-scan to ensure integrity
                ScanLyrics(container);
                Update();
                mutNum = 0;
                return;
            }

            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    handleChildListMutation(mutation);
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                Update();
                mutNum++;
            }
        })
    );
    lyricObserver.observe(container, { attributes: false, childList: true, subtree: false });

    // Create our observer to watch for size-changes
    const sizeObserver = LyricsCleanup.AddObserver(new ResizeObserver(() => LyricsCleanup.AddTask(Timeout(ContainerResizeStabilizationTime, UpdateResize), "ContainerResize")));
    sizeObserver.observe(document.body);

    // Force-update
    UpdateResize();
    Update();
};

let ActiveLyricsContainer: HTMLDivElement | null = null;
const CheckForLyricsContainers = (mainLyricsContainer: HTMLDivElement | null) => {
    const fullScreenContainerPre = mainLyricsContainer ? Spotify.getComponent<HTMLDivElement>("FullScreenLyricsContainerClass", mainLyricsContainer) : null;
    // Some layouts wrap the real container in a single child; unwrap to target the live lyric host
    let fullScreenContainer: HTMLDivElement | null = fullScreenContainerPre;
    if (fullScreenContainerPre && fullScreenContainerPre.childNodes.length === 1 && fullScreenContainerPre.childNodes[0] instanceof HTMLDivElement) {
        fullScreenContainer = fullScreenContainerPre.childNodes[0] as HTMLDivElement;
    }

    if (ActiveLyricsContainer === fullScreenContainer) {
        return;
    }

    // Clear our previous container
    ActiveLyricsContainer = null;
    LyricsCleanup.Clean();

    // Now manage the container
    if (fullScreenContainer) {
        ActiveLyricsContainer = fullScreenContainer;
        ManageLyricsContainer(fullScreenContainer);
    }
};

export const Start = (mainLyricsContainer: HTMLDivElement | null) => {
    GlobalCleanup.AddTask(Player.SongChanged.Connect(() => (ActiveLyricsContainer = null)));
    CheckForLyricsContainers(mainLyricsContainer);
};

export { CheckForLyricsContainers };
