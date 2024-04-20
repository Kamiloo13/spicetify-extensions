// Services
import Player from "./Player";
import { GlobalCleanup, SpotifyPlayer } from "./Session";
import Signal from "./Signal";

type CoverArtContainer = "Page" | "SidePanel" | "LyricsPlusFullScreen";

// Create our signals/events
export const CoverArtUpdated = new Signal();

// Store our cover-art
let CoverArt: CoverArt | undefined;

// Behavior Constants
const BlurSizeIncrease = 1.25;
const BlurSize = 40;

const CoverArtContainerFilters: Map<CoverArtContainer | "Default", string> = new Map();
CoverArtContainerFilters.set("Default", "brightness(0.5) saturate(2.5)");
CoverArtContainerFilters.set("SidePanel", "brightness(1) saturate(2.25)");

// Store our Blurred-CoverArt
const BlurredCoverArts: Map<string, Map<CoverArtContainer, Map<number, string>>> = new Map();

// Handle generating blurred-images
const GetCoverArtURLToBlur = (coverArt: CoverArt) => {
    return coverArt.Default;
};

const GenerateBlurredCoverArt = async (coverArt: CoverArt, coverArtContainer: CoverArtContainer, sizes: number[]) => {
    // Images are square so size is width/height
    // Determine which cover-art we want to use
    const desiredCoverArt = GetCoverArtURLToBlur(coverArt);

    // Load our image
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = desiredCoverArt;
    })
        .then((image) => {
            // Generate all our images
            const blobPromises = [];

            for (const size of sizes) {
                // Determine our images actual width/height
                const imageWidth = size,
                    imageHeight = size;

                // Create our canvas
                const canvas = new OffscreenCanvas(imageWidth, imageHeight);
                const context = canvas.getContext("2d")!;

                // Handle rendering our main-canvas
                {
                    // Determine the center where we draw things at
                    const centerX = canvas.width / 2,
                        centerY = canvas.height / 2;

                    // Create our crop
                    {
                        context.beginPath();
                        context.arc(centerX, centerY, centerX, 0, Math.PI * 2);
                        context.clip();
                    }

                    // Draw our image
                    context.drawImage(image, 0, 0, imageWidth, imageHeight);
                }

                // Create our blur-canvas
                const blurCanvas = new OffscreenCanvas(Math.round(imageWidth * BlurSizeIncrease), Math.round(imageHeight * BlurSizeIncrease));
                const blurContext = blurCanvas.getContext("2d")!;

                // Handle rendering our blur-canvas
                {
                    // Determine the center where we draw things at
                    const centerX = blurCanvas.width / 2,
                        centerY = blurCanvas.height / 2;

                    // Grab our other filters
                    const filters = CoverArtContainerFilters.get(coverArtContainer) ?? CoverArtContainerFilters.get("Default")!;

                    // Apply our blur
                    blurContext.filter = `${filters} blur(${BlurSize}px)`;
                    // blurContext.filter = filters

                    // Draw our main image onto our blur-canvas
                    blurContext.drawImage(canvas, centerX - canvas.width / 2, centerY - canvas.height / 2);
                }

                // Now store our blob
                blobPromises.push(
                    blurCanvas.convertToBlob({
                        type: "image/webp",
                        quality: 1
                    })
                );
            }

            // Generate our buffer
            return Promise.all(blobPromises);
        })
        .then((blobs) => {
            // Check if we have to create our main container
            let storage = BlurredCoverArts.get(desiredCoverArt);
            if (storage === undefined) {
                storage = new Map();
                BlurredCoverArts.set(desiredCoverArt, storage);
            }

            // Go through our old cover-art if we have any
            const oldCoverArts = storage.get(coverArtContainer);
            if (oldCoverArts !== undefined) {
                for (const oldURL of oldCoverArts.values()) {
                    URL.revokeObjectURL(oldURL);
                }
            }

            // Store our blurred image
            const urls = new Map<number, string>();
            for (let index = 0; index < blobs.length; index++) {
                urls.set(sizes[index], URL.createObjectURL(blobs[index]));
            }

            // Return our url
            return urls;
        });
};

const GetBlurredCoverArt = (coverArt: CoverArt, coverArtContainer: CoverArtContainer, sizes: number[]) => {
    // Determine which cover-art we want to use
    const desiredCoverArt = GetCoverArtURLToBlur(coverArt);

    // Determine if we already have a blurred version of this cover-art
    const blurredCoversStorage = BlurredCoverArts.get(desiredCoverArt);
    if (blurredCoversStorage !== undefined) {
        const blurredCoverArt = blurredCoversStorage.get(coverArtContainer);

        if (blurredCoverArt !== undefined) {
            // Make sure that all our sizes exist
            for (const size of sizes) {
                if (blurredCoverArt.has(size) === false) {
                    return undefined;
                }
            }

            // Now return our blurred cover-art
            return blurredCoverArt;
        }
    }

    return undefined;
};

// Handle update requests
const Update = () => {
    const metadata = SpotifyPlayer.data.item.metadata;

    const newCoverArt = {
        Large: metadata.image_xlarge_url,
        Big: metadata.image_large_url,
        Default: metadata.image_url,
        Small: metadata.image_small_url
    };

    // Now determine if there was an update or not
    if (newCoverArt.Default !== CoverArt?.Default) {
        // Update our cover-art
        CoverArt = newCoverArt;

        // Update our cover-art image
        CoverArtUpdated.Fire();
    }
};

// Exports
export const GetCoverArt = () => CoverArt;
export const Start = () => {
    // Handle manual/automatic updates
    GlobalCleanup.AddTask(Player.SongChanged.Connect(Update));
    Update();
};
export { GetBlurredCoverArt, GenerateBlurredCoverArt };
