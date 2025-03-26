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

export interface SpMetadataFetch {
    album: {
        artist: SpArtist[];
        cover_group: {
            image: SpAlbumArt[];
        };
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

interface LyricsSynched {
    startTimeMs: string;
    words: string;
    syllables: string[];
    endTimeMs: string;
}

export interface LyricsResponse {
    lines: LyricsSynched[];
    provider: string;
    providerLyricsDisplayName: string;
    providerLyricsId: string;
    isSynced: boolean;
}

export interface LyricCached {
    gid: string;
    canonical_id: string;
    data?: {
        colors: {
            background: number;
            highlightText: number;
            text: number;
        };
        hasVocalRemoval: boolean;
        lyrics: {
            alternatives: [];
            capStatus: string;
            isDenseTypeface: boolean;
            isRtlLanguage: boolean;
            isSnippet: boolean;
            language: string;
            lines: LyricsSynched[];
            previewLines: LyricsSynched[];
            provider: string;
            providerLyricsDisplayName: string;
            providerLyricsId: string;
            syncLyricsUri: string;
            syncType: "LINE_SYNCED" | "UNSYNCED";
        };
    };
}
