import Cleanup from "../services/Cleanup";
import { CoverArtUpdated, GetCoverArt } from "../services/CoverArt";
import { GlobalCleanup } from "../services/Session";
import Spotify from "../services/Spotify";

import "../styles/main.scss";

const BackgroundElements = ["lyrics-background-color", "lyrics-background-back", "lyrics-background-back-center"]; // Own class names

const BackgroundMainCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "LiveMainBackgrounds");
// const BackgroundSidebarCleanup = GlobalCleanup.AddSubCleanup(new Cleanup(), "LiveSidebarBackgrounds");

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

    const UpdateCoverArt = () => {
        const coverArt = GetCoverArt();
        const source = coverArt?.Default ?? "";

        for (const element of elements) {
            element.src = source;
        }
    };

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

// const ManageLyricsBackgroundSidebar = (container: HTMLDivElement) => {
//     const backgroundContainer = BackgroundSidebarCleanup.AddHtml(document.createElement("div"));
//     backgroundContainer.classList.add("lyrics-background-container");
//     backgroundContainer.style.zIndex = "-1";

//     // Create all our elements
//     const elements: HTMLImageElement[] = [];
//     for (const elementClass of BackgroundElements) {
//         // Create our image
//         const image = BackgroundSidebarCleanup.AddHtml(document.createElement("img"));
//         image.classList.add(elementClass);
//         backgroundContainer.appendChild(image);

//         // Now store our element
//         elements.push(image as HTMLImageElement);
//     }

//     const UpdateCoverArt = () => {
//         const coverArt = GetCoverArt();
//         const source = coverArt?.Default ?? "";

//         for (const element of elements) {
//             element.src = source;
//         }
//     };

//     BackgroundSidebarCleanup.AddTask(CoverArtUpdated.Connect(UpdateCoverArt));
//     UpdateCoverArt();

//     // Handle applying our background-class
//     const CheckClass = () => {
//         if (container.classList.contains("lyrics-background")) {
//             return;
//         }

//         container.classList.add("lyrics-background");
//     };

//     container.style.position = "relative";

//     // Immediately check our class and watch for changes
//     CheckClass();

//     const observer = BackgroundSidebarCleanup.AddObserver(new MutationObserver(CheckClass));
//     observer.observe(container, { attributes: true, attributeFilter: ["class"], childList: false, subtree: false });

//     // Add our container to the background
//     container.prepend(backgroundContainer);

//     BackgroundSidebarCleanup.AddTask(() => {
//         container.classList.remove("lyrics-background");
//         container.style.position = "";
//     });
// };

let ExistingContainerMain: HTMLDivElement | null = null;
// let ExistingContainerSidebar: HTMLDivElement | null = null;
let prevMain: HTMLDivElement | null = null;
const CheckForLiveBackgrounds = (mainLyricsContainer: HTMLDivElement | null) => {
    const fullScreenContainer = mainLyricsContainer ? Spotify.getComponent<HTMLDivElement>("FullScreenLyricsBackgroundClass", mainLyricsContainer) : null;

    if (ExistingContainerMain === fullScreenContainer) {
        return;
    }

    if (fullScreenContainer === null) {
        ExistingContainerMain = null;
        BackgroundMainCleanup.Clean();
    } else {
        ExistingContainerMain = fullScreenContainer;

        const normalBackgroundContainer = mainLyricsContainer?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector(
            ".before-scroll-node"
        ) as HTMLDivElement;

        if (prevMain && prevMain !== mainLyricsContainer) {
            BackgroundMainCleanup.Clean();
        }
        prevMain = mainLyricsContainer;

        if (normalBackgroundContainer) {
            ManageLyricsBackground(normalBackgroundContainer);
            return;
        }

        // Create a div element on the 5th parent element
        const parentElement = Spotify.getComponent<HTMLDivElement>("CinemaModeContainerToInjectBackground", document.body);
        if (parentElement) {
            const uselessElem = Spotify.getComponent<HTMLDivElement>("CinemaModeBackgroundToRemove", parentElement);
            if (uselessElem) uselessElem.style.background = "none";

            const newDiv = BackgroundMainCleanup.AddHtml(document.createElement("div"));
            parentElement.prepend(newDiv);
            ManageLyricsBackground(newDiv);
        }
    }
};

// const CheckForLiveBackgroundsSidebar = (mainLyricsContainer: HTMLDivElement | null) => {
//     const sidebarContainer = mainLyricsContainer ? Spotify.getComponent<HTMLDivElement>("SidebarLyricsBackgroundClass", mainLyricsContainer) : null;

//     if (ExistingContainerSidebar === sidebarContainer) {
//         return;
//     }

//     if (sidebarContainer === null) {
//         ExistingContainerSidebar = null;
//         BackgroundSidebarCleanup.Clean();
//     } else {
//         ExistingContainerSidebar = sidebarContainer;
//         ManageLyricsBackgroundSidebar(sidebarContainer);
//     }
// };

// const CheckForLiveBackgrounds = (mainLyricsContainer: HTMLDivElement | null) => {
//     CheckForLiveBackgroundsMain(mainLyricsContainer);
//     // CheckForLiveBackgroundsSidebar(mainLyricsContainer);
// };

export { CheckForLiveBackgrounds };
