import Cleanup from "../services/Cleanup";
import { CoverArtUpdated, GenerateBlurredCoverArt, GetBlurredCoverArt, GetCoverArt } from "../services/CoverArt";
import { GlobalCleanup } from "../services/Session";
import Spotify from "../services/Spotify";
import Timeout from "../services/Timeout";

import "../styles/main.scss";

const UsePreBlurredApproach = false; // TODO: Add internal setting for this FIXME: it's jiggly as fuck

const BackgroundSizeScales = [2, 3];
const BackgroundElements = ["lyrics-background-color", "lyrics-background-back", "lyrics-background-back-center"]; // Own class names
const ElementSizeScaleIndices = [0, 0, 1];
const BackgroundContainerResizeStabilizationTime = 0.25;

const BackgroundMainCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "LiveMainBackgrounds");
const BackgroundSidebarCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "LiveSidebarBackgrounds");

const ManageLyricsBackground = (container: HTMLDivElement) => {
    // Create our container and child-images
    const backgroundContainer = BackgroundMainCleanup.AddHtml(document.createElement("div"));
    backgroundContainer.classList.add("lyrics-background-container");

    // Create all our elements
    const elements: HTMLImageElement[] = [];
    for (const elementClass of BackgroundElements) {
        // Create our image
        const image = BackgroundMainCleanup.AddHtml(document.createElement("img"));
        image.classList.add(elementClass);
        backgroundContainer.appendChild(image);

        // Now store our element
        elements.push(image as HTMLImageElement);
    }

    let UpdateCoverArt: Callback;

    if (UsePreBlurredApproach) {
        let currentSizes: number[] = [];

        const SetCoverArt = (blurredCoverArt?: Map<number, string>) => {
            for (const [index, element] of elements.entries()) {
                element.src = blurredCoverArt ? blurredCoverArt.get(currentSizes[ElementSizeScaleIndices[index]]) ?? "MISSING" : "";
            }
        };

        UpdateCoverArt = () => {
            // Grab our cover-art
            const coverArt = GetCoverArt();
            if (coverArt === undefined) {
                return SetCoverArt();
            }

            for (const element of elements) {
                element.src = coverArt.Default;
            }

            // Now determine if we already have this or not
            const cachedCoverArtSizes = GetBlurredCoverArt(coverArt, "LyricsPlusFullScreen", currentSizes);

            // If we have it we can then update immediately, otherwise we need to generate it
            if (cachedCoverArtSizes === undefined) {
                GenerateBlurredCoverArt(coverArt, "LyricsPlusFullScreen", currentSizes).then((coverArtSizes) => {
                    // Make sure we are seeing the same cover-art
                    if (coverArt === GetCoverArt()) {
                        SetCoverArt(coverArtSizes);
                    }
                });
            } else {
                SetCoverArt(cachedCoverArtSizes);
            }
        };

        const UpdateSizes = () => {
            // Calculate our existing width
            const backgroundContainerWidth = backgroundContainer.offsetWidth;

            // Calculate our new sizes
            const newSizes = [];
            for (const scale of BackgroundSizeScales) {
                newSizes.push(Math.floor(backgroundContainerWidth * scale));
            }

            // Now set our sizes
            currentSizes = newSizes;

            // Trigger cover-art update
            UpdateCoverArt();
        };

        // Watch for size-updates
        const observer = BackgroundMainCleanup.AddObserver(
            // Set a timeout to update our sizes (once we stabilize it will properly run)
            new ResizeObserver(() => BackgroundMainCleanup.AddTask(Timeout(BackgroundContainerResizeStabilizationTime, UpdateSizes), "ContainerResize"))
        );
        observer.observe(backgroundContainer);

        // Immediately update our sizes
        UpdateSizes();
    } else {
        UpdateCoverArt = () => {
            const coverArt = GetCoverArt();
            const source = coverArt?.Default ?? "";

            for (const element of elements) {
                element.src = source;
            }
        };
    }

    BackgroundMainCleanup.AddTask(CoverArtUpdated.Connect(UpdateCoverArt));
    UpdateCoverArt();

    // Handle applying our background-class
    const CheckClass = () => {
        if (container.classList.contains("lyrics-background")) {
            return;
        }

        container.classList.add("lyrics-background");
    };

    // Immediately check our class and watch for changes
    CheckClass();

    const observer = BackgroundMainCleanup.AddObserver(new MutationObserver(CheckClass));
    observer.observe(container, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

    // Add our container to the background
    container.prepend(backgroundContainer);

    BackgroundMainCleanup.AddTask(() => container.classList.remove("lyrics-background"));
};

const ManageLyricsBackgroundSidebar = (container: HTMLDivElement) => {
    const backgroundContainer = BackgroundSidebarCleanup.AddHtml(document.createElement("div"));
    backgroundContainer.classList.add("lyrics-background-container");
    backgroundContainer.style.zIndex = "-1";

    // Create all our elements
    const elements: HTMLImageElement[] = [];
    for (const elementClass of BackgroundElements) {
        // Create our image
        const image = BackgroundSidebarCleanup.AddHtml(document.createElement("img"));
        image.classList.add(elementClass);
        backgroundContainer.appendChild(image);

        // Now store our element
        elements.push(image as HTMLImageElement);
    }

    const UpdateCoverArt = () => {
        const coverArt = GetCoverArt();
        const source = coverArt?.Default ?? "";

        for (const element of elements) {
            element.src = source;
        }
    };

    BackgroundSidebarCleanup.AddTask(CoverArtUpdated.Connect(UpdateCoverArt));
    UpdateCoverArt();

    // Handle applying our background-class
    const CheckClass = () => {
        if (container.classList.contains("lyrics-background")) {
            return;
        }

        container.classList.add("lyrics-background");
    };

    container.style.position = "relative";

    // Immediately check our class and watch for changes
    CheckClass();

    const observer = BackgroundSidebarCleanup.AddObserver(new MutationObserver(CheckClass));
    observer.observe(container, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

    // Add our container to the background
    container.prepend(backgroundContainer);

    BackgroundSidebarCleanup.AddTask(() => {
        container.classList.remove("lyrics-background");
        container.style.position = "";
    });
};

let ExistingContainerMain: HTMLDivElement | null = null;
let ExistingContainerSidebar: HTMLDivElement | null = null;
const CheckForLiveBackgroundsMain = () => {
    const fullScreenContainer = Spotify.getComponent<HTMLDivElement>("FullScreenLyricsBackgroundClass");

    if (ExistingContainerMain === fullScreenContainer) {
        return;
    }

    if (fullScreenContainer === null) {
        ExistingContainerMain = null;
        BackgroundMainCleanup.Clean();
    } else {
        ExistingContainerMain = fullScreenContainer;
        fullScreenContainer.style.background = "linear-gradient(90deg, #0a0a0a8a, #0000)";
        ManageLyricsBackground(
            fullScreenContainer?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector(".under-main-view") as HTMLDivElement
        );
    }
};

const CheckForLiveBackgroundsSidebar = () => {
    const sidebarContainer = Spotify.getComponent<HTMLDivElement>("SidebarLyricsBackgroundClass");

    if (ExistingContainerSidebar === sidebarContainer) {
        return;
    }

    if (sidebarContainer === null) {
        ExistingContainerSidebar = null;
        BackgroundSidebarCleanup.Clean();
    } else {
        ExistingContainerSidebar = sidebarContainer;
        ManageLyricsBackgroundSidebar(sidebarContainer);
    }
};

const CheckForLiveBackgrounds = () => {
    CheckForLiveBackgroundsMain();
    CheckForLiveBackgroundsSidebar();
};

export { CheckForLiveBackgrounds };
