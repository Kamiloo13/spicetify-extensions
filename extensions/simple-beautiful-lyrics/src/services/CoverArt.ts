// Services
import Player from "./Player";
import { GlobalCleanup, SpotifyPlayer } from "./Session";
import Signal from "./Signal";

type CoverArtContainer = "Page" | "SidePanel" | "LyricsPlusFullScreen";

// Create our signals/events
export const CoverArtUpdated = new Signal();

// Store our cover-art
let CoverArt: CoverArt | undefined;

const CoverArtContainerFilters = new Map<CoverArtContainer | "Default", string>();
CoverArtContainerFilters.set("Default", "brightness(0.5) saturate(2.5)");
CoverArtContainerFilters.set("SidePanel", "brightness(1) saturate(2.25)");

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
