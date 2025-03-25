type Callback = () => void;

interface ProvidedMetadata {
    album_artist_name: string;
    album_disc_count: string;
    album_disc_number: string;
    album_title: string;
    album_track_count: string;
    album_track_number: string;
    album_uri: string;

    artist_name: string;
    artist_uri: string;

    "canvas.artist.avatar": string;
    "canvas.artist.name": string;
    "canvas.artist.uri": string;
    "canvas.canvasUri": string;
    "canvas.entityUri": string;
    "canvas.explicit": string;
    "canvas.fileId": string;
    "canvas.id": string;
    "canvas.type": string;
    "canvas.uploadedBy": string;
    "canvas.url": string;

    "collection.can_add": string;
    "collection.can_ban": string;
    "collection.in_collection": string;
    "collection.is_banned": string;

    is_local?: string;
    local_file_path?: string;
    local_file_size?: string;

    context_uri: string;
    duration: string;
    entity_uri: string;
    has_lyrics: string;

    image_large_url: string;
    image_small_url: string;
    image_url: string;
    image_xlarge_url: string;

    interaction_id: string;
    iteration: string;
    marked_for_download: string;
    page_instance_id: string;
    popularity: string;
    title: string;
    track_player: string;
}

// Cover Art
interface CoverArt {
    Large: string;
    Big: string;
    Default: string;
    Small: string;
}

interface SpArtist {
    gid: string;
    name: string;
}

interface SpAlbumArt {
    file_id: string;
    height: number;
    size: "DEFAULT" | "LARGE" | "SMALL";
    width: number;
}

interface SpMetadataFetch {
    album: {
        artist: SpArtist[];
        cover_group: {
            image: SpAlbumArt[];
        }
        date: { year: number; month: number; day: number };
        gid: string;
        label: string;
        name: string;
    };
    artist: SpArtist[];
    artist_with_role: any[]; // We don't need this
    audio_formats: any[]; // We don't need this
    canonical_uri: string;
    content_authorization_attributes: string; // We don't need this
    disc_number: number; // We don't need this
    duration: number;
    earliest_live_timestamp: number; // We don't need this
    explicit?: boolean;
    external_id: any[]; // We don't need this
    file: any[]; // We don't need this
    gid: string;
    has_lyrics?: boolean;
    language_of_performance: string[];
    licensor: any; // We don't need this
    name: string;
    number: number; // We don't need this
    original_audio: any; // We don't need this
    original_title: string; // We don't need this
    popularity: number; // We don't need this
    prerelease_config: any; // We don't need this
    preview: any[]; // We don't need this
}

interface LRCLibResponse {
    albumName: string;
    artistName: string;
    duration: number;
    id: number;
    instrumental: boolean;
    name: string;
    plainLyrics: string;
    syncedLyrics?: string;
    trackName: string;
    statusCode?: number;
}

// Lyrics
type LyricState = "Unsynced" | "Unsung" | "Active" | "Sung";
