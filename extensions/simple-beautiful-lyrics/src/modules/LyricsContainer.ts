import Cleanup from "../services/Cleanup";
import { GlobalCleanup } from "../services/Session";

import "../styles/lyrics.scss";

const LyricClass = "lyrics-lyricsContent-lyric";
const UnsyncedLyricClass = "lyrics-lyricsContent-unsynced";
const HighlightedLyricClass = "lyrics-lyricsContent-highlight";
const ActiveLyricClass = "lyrics-lyricsContent-active";

const DistanceToMaximumBlur = 4; // Any lyrics beyond this unit of distance away will be at full-blur
const ActiveLyricSizeIncrease = 0.5; // This is measured in rem Units as all Spotify fonts are rendered with them

const LyricsCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "Lyrics");

const GetLyricFontSizeInRem = (lyric: HTMLDivElement): number => {
    /*
		The idea here is that we can get the font-size of our text in pixels.

		We know that the font-size in CSS is in rem-units. We also know that the documents
		font-size is equievelant to 1rem. So what we can then do is get the computed styles
		for both elements and divide their font-sizes to get the font-size in rem-units.
	*/
    const style = getComputedStyle(lyric),
        rootStyle = getComputedStyle(document.documentElement);
    const lyricFontSizeInPixels = parseFloat(style.fontSize),
        rootFontSizeInPixels = parseFloat(rootStyle.fontSize);

    return lyricFontSizeInPixels / rootFontSizeInPixels;
};

const ManageLyricsContainer = (container: HTMLDivElement) => {
    // Create our storage for each lyric
    type LyricsData = {
        LayoutOrder: number;
        State: LyricState;
        IsFontSizeObserver: boolean;
    };
    const lyrics: Map<HTMLDivElement, LyricsData> = new Map();

    // Handle updating our lyrics
    let fontSizeInRem: number = 0;

    const UpdateFontSize = (lyric: HTMLDivElement, data: LyricsData) => {
        lyric.style.fontSize = data.State == "Active" ? `${fontSizeInRem + ActiveLyricSizeIncrease}rem` : "";
    };

    const Update = () => {
        // Go through our lyrics and update their states (and also gather our active layout-order)
        let activeLayoutOrder: number = 0;
        for (const [lyric, data] of lyrics) {
            const classes = lyric.classList;

            if (classes.contains(ActiveLyricClass)) {
                data.State = "Active";
                activeLayoutOrder = data.LayoutOrder;
            } else if (classes.contains(UnsyncedLyricClass)) {
                data.State = "Unsynced";
            } else if (classes.contains(HighlightedLyricClass)) {
                data.State = "Sung";
            } else {
                data.State = "Unsung";
            }
        }

        // Go through our lyrics and handle updating their appearance
        let firstPass = true;
        for (const [lyric, data] of lyrics) {
            // Determine if we should be considered active
            const isActive = data.State === "Active";
            const isFocused = isActive || data.State === "Unsynced" || (activeLayoutOrder <= 1 && firstPass);

            // Determine our blur
            let blur: number;
            if (isFocused) {
                blur = 0;
            } else {
                const distance = Math.min(Math.abs(data.LayoutOrder - activeLayoutOrder), DistanceToMaximumBlur);

                blur = distance;
            }

            // Determine our text-color
            const textColor = isFocused ? "var(--lyrics-color-active)" : data.State === "Sung" ? "var(--lyrics-color-passed)" : "var(--lyrics-color-inactive)";

            // Give ourselves the lyric class
            if (lyric.classList.contains("lyric") === false) {
                lyric.classList.add("lyric");
            }

            // Update our font-size
            UpdateFontSize(lyric, data);

            // Update our lyric appearance according to our blur
            lyric.style.color = "transparent";
            lyric.style.textShadow = `0 0 ${blur}px ${textColor}`;
            firstPass = false;
        }
    };

    // Handle finding our lyrics

    let fontResizeObserver: ResizeObserver | undefined;

    // Helper-Method to store Lyrics
    const StoreLyric = (lyric: HTMLDivElement) => {
        // Find our layout-order
        const layoutOrder = Array.from(container.children).indexOf(lyric);

        // Create our observer to watch for class-changes
        const mutationObserver = LyricsCleanup.AddObserver(new MutationObserver(Update));
        mutationObserver.observe(lyric, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

        // Create our observer to watch for size-changes
        let isFontSizeObserver = false;

        if (fontResizeObserver === undefined && lyric.innerText.length === 0) {
            fontResizeObserver = LyricsCleanup.AddObserver(
                new ResizeObserver(() => {
                    fontSizeInRem = GetLyricFontSizeInRem(lyric);

                    for (const [lyricToUpdate, data] of lyrics) {
                        UpdateFontSize(lyricToUpdate, data);
                    }
                })
            ) as ResizeObserver;
            fontResizeObserver.observe(lyric);

            isFontSizeObserver = true;
        }

        // Store our lyric
        lyrics.set(lyric, {
            LayoutOrder: layoutOrder,
            State: "Unsung",
            IsFontSizeObserver: isFontSizeObserver
        });

        // Force-update
        Update();
    };

    const CheckNode = (node: Node) => {
        if (node instanceof HTMLDivElement && node.classList.contains(LyricClass)) {
            StoreLyric(node);
        }
    };

    const observer = LyricsCleanup.AddObserver(new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach(CheckNode))));
    observer.observe(container, { attributes: false, childList: true, subtree: false });

    // Grab our initial lyrics
    for (const node of container.childNodes) {
        CheckNode(node);
    }
};

const FullScreenLyricsContainerClass = "lyrics-lyrics-contentWrapper";

let ActiveLyricsContainer: HTMLDivElement | null = null;
const CheckForLyricsContainers = () => {
    const fullScreenContainer = document.body.querySelector(`.${FullScreenLyricsContainerClass}`) as HTMLDivElement | null;

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

export { CheckForLyricsContainers };
