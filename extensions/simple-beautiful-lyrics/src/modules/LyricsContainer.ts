import Cleanup from "../services/Cleanup";
import Player from "../services/Player";
import { GlobalCleanup } from "../services/Session";
import Spotify from "../services/Spotify";
import Timeout from "../services/Timeout";

import "../styles/lyrics.scss";

const DistanceToMaximumBlur = 4; // Any lyrics beyond this unit of distance away will be at full-blur
const ActiveLyricSizeIncrease = 0.5; // This is measured in rem Units as all Spotify fonts are rendered with them
const ContainerResizeStabilizationTime = 0.25;
const ContainerUpdateWaitTime = 0.005;

const LyricsCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "Lyrics");

const ManageLyricsContainer = (container: HTMLDivElement) => {
    // Create our storage for each lyric
    interface LyricsData {
        LayoutOrder: number;
        State: LyricState;
    }
    const lyrics = new Map<HTMLDivElement, LyricsData>();

    // Handle updating our lyrics
    let fontSizeInRem = 0;

    const UpdateFontSize = (lyric: HTMLDivElement, data: LyricsData) => {
        lyric.style.fontSize = data.State == "Active" ? `${fontSizeInRem + ActiveLyricSizeIncrease}rem` : "";
    };

    const Update = () => {
        // Go through our lyrics and update their states (and also gather our active layout-order)
        let activeLayoutOrder = 0;
        for (const [lyric, data] of lyrics) {
            const classes = lyric.classList;

            if (Spotify.checkClassNamesMatch(classes, "ActiveLyricClass")) {
                data.State = "Active";
                activeLayoutOrder = data.LayoutOrder;
            } else if (Spotify.checkClassNamesMatch(classes, "UnsyncedLyricClass")) {
                data.State = "Unsynced";
            } else if (Spotify.checkClassNamesMatch(classes, "HighlightedLyricClass")) {
                data.State = "Sung";
            } else {
                data.State = "Unsung";
            }
        }

        // Go through our lyrics and handle updating their appearance
        for (const [lyric, data] of lyrics) {
            // Determine if we should be considered active
            const isActive = data.State === "Active";
            const isFocused = isActive || data.State === "Unsynced";

            // Determine our blur
            let blur: number;
            if (isFocused || activeLayoutOrder <= 1) {
                blur = 0;
            } else {
                const distance = Math.min(Math.abs(data.LayoutOrder - activeLayoutOrder), DistanceToMaximumBlur);

                blur = distance;
            }

            // Determine our text-color
            const textColor = isFocused ? "var(--lyrics-color-active)" : data.State === "Sung" ? "var(--lyrics-color-passed)" : "var(--lyrics-color-inactive)";

            // Update our font-size
            UpdateFontSize(lyric, data);

            // Update our lyric appearance according to our blur
            lyric.style.color = "transparent";
            lyric.style.textShadow = `0 0 ${blur}px ${textColor}`;
        }
    };

    const UpdateResize = () => {
        const style = getComputedStyle(container),
            rootStyle = getComputedStyle(document.documentElement);
        const lyricFontSizeInPixels = parseFloat(style.fontSize),
            rootFontSizeInPixels = parseFloat(rootStyle.fontSize);

        fontSizeInRem = lyricFontSizeInPixels / rootFontSizeInPixels;

        for (const [lyricToUpdate, data] of lyrics) {
            UpdateFontSize(lyricToUpdate, data);
        }
    };

    // Helper-Method to store Lyrics
    const StoreLyric = (lyric: HTMLDivElement) => {
        // Find our layout-order
        const layoutOrder = Array.from(container.children).indexOf(lyric);

        // Create our observer to watch for class-changes
        const mutationObserver = LyricsCleanup.AddObserver(new MutationObserver(() => LyricsCleanup.AddTask(Timeout(ContainerUpdateWaitTime, Update), "LyricUpdate")));
        mutationObserver.observe(lyric, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

        // Store our lyric
        lyrics.set(lyric, {
            LayoutOrder: layoutOrder,
            State: "Unsung"
        });
    };

    // Grab our lyrics
    for (const node of container.childNodes) {
        if (node instanceof HTMLDivElement && Spotify.checkClassNamesMatch(node.classList, "LyricClass")) {
            StoreLyric(node);
        }
    }

    // Create our observer to watch for size-changes
    const sizeObserver = LyricsCleanup.AddObserver(new ResizeObserver(() => LyricsCleanup.AddTask(Timeout(ContainerResizeStabilizationTime, UpdateResize), "ContainerResize")));
    sizeObserver.observe(document.body);

    // Force-update
    UpdateResize();
    Update();
};

let ActiveLyricsContainer: HTMLDivElement | null = null;
const CheckForLyricsContainers = () => {
    const fullScreenContainer = Spotify.getComponent<HTMLDivElement>("FullScreenLyricsContainerClass");

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

export const Start = () => {
    GlobalCleanup.AddTask(Player.SongChanged.Connect(() => (ActiveLyricsContainer = null)));
    CheckForLyricsContainers();
};

export { CheckForLyricsContainers };
