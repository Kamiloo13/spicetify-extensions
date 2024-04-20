import Cleanup from "../services/Cleanup";
import { CoverArtUpdated, GenerateBlurredCoverArt, GetBlurredCoverArt, GetCoverArt } from "../services/CoverArt";
import { GlobalCleanup } from "../services/Session";
import Timeout from "../services/Timeout";

import "../styles/main.scss";

const UsePreBlurredApproach = false; // TODO: Add internal setting for this FIXME: it's jiggly as fuck

const BackgroundSizeScales = [2, 3];
const BackgroundElements = ["lyrics-background-color", "lyrics-background-back", "lyrics-background-back-center"];
const ElementSizeScaleIndices = [0, 0, 1];
const BackgroundContainerResizeStabilizationTime = 0.25;

const BackgroundCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "LiveBackgrounds");

const ManageLyricsBackground = (container: HTMLDivElement) => {
    // Create our container and child-images
    const backgroundContainer = BackgroundCleanup.AddHtml(document.createElement("div"));
    backgroundContainer.classList.add("lyrics-background-container");

    // Create all our elements
    const elements: HTMLImageElement[] = [];
    for (const elementClass of BackgroundElements) {
        // Create our image
        const image = BackgroundCleanup.AddHtml(document.createElement("img"));
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
        const observer = BackgroundCleanup.AddObserver(
            new ResizeObserver(() => {
                // Set a timeout to update our sizes (once we stabilize it will properly run)
                BackgroundCleanup.AddTask(Timeout(BackgroundContainerResizeStabilizationTime, UpdateSizes), "ContainerResize");
            })
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

    BackgroundCleanup.AddTask(CoverArtUpdated.Connect(UpdateCoverArt));
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

    const observer = BackgroundCleanup.AddObserver(new MutationObserver(CheckClass));
    observer.observe(container, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

    // Add our container to the background
    container.prepend(backgroundContainer);

    BackgroundCleanup.AddTask(() => container.classList.remove("lyrics-background"));
};

const FullScreenLyricsBackgroundClass = "lyrics-lyrics-background";

let ExistingContainer: HTMLDivElement | null = null;
const CheckForLiveBackgrounds = () => {
    const fullScreenContainer = document.body.querySelector(`.${FullScreenLyricsBackgroundClass}`) as HTMLDivElement;

    if (ExistingContainer === fullScreenContainer) {
        return;
    }

    if (fullScreenContainer === null) {
        ExistingContainer = null;
        BackgroundCleanup.Clean();
    } else {
        ExistingContainer = fullScreenContainer;
        fullScreenContainer.style.display = "none";
        ManageLyricsBackground(
            document.body
                .querySelector(`.${FullScreenLyricsBackgroundClass}`)
                ?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector(".under-main-view") as HTMLDivElement
        );
    }
};

export { CheckForLiveBackgrounds };
