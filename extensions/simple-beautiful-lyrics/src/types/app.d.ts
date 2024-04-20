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

// Lyrics
type LyricState = "Unsynced" | "Unsung" | "Active" | "Sung";
