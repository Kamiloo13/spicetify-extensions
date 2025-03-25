const f = window.fetch;

interface LyricsSynched {
    startTimeMs: string;
    words: string;
    syllables: string[];
    endTimeMs: string;
}

interface LyricCached {
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

const LyricsDataBank: LyricCached[] = [];
let RequestCount = 0;
let CurrentRequestId = 0;

const checkOverflow = () => {
    if (RequestCount > Number.MAX_SAFE_INTEGER - 1001) {
        RequestCount = 0;
    }

    if (CurrentRequestId > Number.MAX_SAFE_INTEGER - 1002) {
        CurrentRequestId = 0;
    }
};

const fetchOverride = async (...args: [input: RequestInfo | URL, init?: RequestInit | undefined]): Promise<Response> => {
    const url = args[0];
    if (typeof url === "string") {
        if (url.startsWith("https://spclient.wg.spotify.com/color-lyrics/v2/track/")) {
            const cannonicalId = url.split("/").at(6);

            if (!cannonicalId) {
                console.error("[SBL]: Cannonical ID not found in 'color-lyrics' fetch");
                return f(...args);
            }

            checkOverflow();
            const MyRequestId = RequestCount++;
            while (MyRequestId > CurrentRequestId) await new Promise((resolve) => setTimeout(resolve, 500));

            const lyrics = LyricsDataBank.find((x) => x.canonical_id === cannonicalId);
            CurrentRequestId++;

            if (lyrics && lyrics.data) {
                console.log(`[SBL]: Lyrics found in 'bank' <${cannonicalId}>`);
                return new Response(JSON.stringify(lyrics.data), {
                    status: 200,
                    statusText: "OK",
                    headers: new Headers({
                        "Content-Type": "application/json"
                    })
                });
            }

            console.log(`[SBL]: Lyrics not found in 'bank' <${cannonicalId}>`);
            return f(...args);
        } else if (url.startsWith("https://spclient.wg.spotify.com/metadata/4/track/")) {
            const gId = url.split("/").at(6)?.split("?").at(0)!;

            if (!gId) {
                console.error("[SBL]: GID not found in 'metadata' fetch");
                return f(...args);
            }

            checkOverflow();
            const MyRequestId = RequestCount++;
            while (MyRequestId > CurrentRequestId) await new Promise((resolve) => setTimeout(resolve, 500));

            const lyrics = LyricsDataBank.find((x) => x.gid === gId);
            const response = await f(...args);

            if (lyrics) {
                CurrentRequestId++;
                if (lyrics.data) {
                    console.log(`[SBL]: Lyrics found in 'bank' when fetching for 'metadata' <${gId}>`);
                    return new Response(JSON.stringify(lyrics), {
                        status: 200,
                        statusText: "OK",
                        headers: new Headers({
                            "Content-Type": "application/json"
                        })
                    });
                }

                console.log(`[SBL]: Lyrics found in 'bank' but no data when fetching for 'metadata' <${gId}>`);
                return response;
            }

            const data = (await response.clone().json()) as SpMetadataFetch;
            const canonicalId = data.canonical_uri.split(":").at(-1)!;

            if (data.has_lyrics) {
                console.log(`[SBL]: Lyrics found in 'metadata' <${gId}>`);
                LyricsDataBank.push({
                    gid: gId,
                    canonical_id: canonicalId
                });
                CurrentRequestId++;

                return response;
            }

            const apiResponse = await f(
                `https://lrclib.net/api/get?${new URLSearchParams({
                    artist_name: data.artist[0].name,
                    track_name: data.name,
                    ...(data.album.name && { album_name: data.album.name }),
                    ...(data.duration && { duration: Math.round(data.duration / 1000).toString() })
                }).toString()}`
            ).catch(() => null);

            const apiLyrics = (await apiResponse?.json()) as LRCLibResponse | null;

            CurrentRequestId++;
            if (!apiLyrics || apiLyrics.statusCode === 404) {
                console.warn(`[SBL]: Lyrics not found in 'lrclib.net' <${gId}>`);

                LyricsDataBank.push({
                    gid: gId,
                    canonical_id: canonicalId
                });

                return response;
            }

            console.log(`[SBL]: Lyrics found in 'lrclib.net' <${gId}>`);

            const parseTime = (time: string) => {
                const [min, sec] = time.split(":");
                const [s, ms = "0"] = sec.split(".");
                return (+min * 60 + +s) * 1000 + +ms.padEnd(3, "0").slice(0, 3);
            };

            const lyrs =
                apiLyrics.syncedLyrics?.split("\n").map((x) => {
                    const [timePart, ...words] = x.split("]");

                    return {
                        startTimeMs: parseTime(timePart.slice(1)).toString(),
                        words: words.join(" "),
                        syllables: [],
                        endTimeMs: "0"
                    };
                }) ??
                apiLyrics.plainLyrics.split("\n").map((x) => ({
                    startTimeMs: "0",
                    words: x,
                    syllables: [],
                    endTimeMs: "0"
                }));
            const lyricsData: LyricCached["data"] = {
                colors: {
                    background: 0,
                    highlightText: 0,
                    text: 0
                },
                hasVocalRemoval: false,
                lyrics: {
                    alternatives: [],
                    capStatus: "NONE",
                    isDenseTypeface: false,
                    isRtlLanguage: false,
                    isSnippet: false,
                    language: data.language_of_performance[0],
                    lines: lyrs,
                    previewLines: lyrs.slice(0, 5),
                    provider: "lrclib.net",
                    providerLyricsDisplayName: "LRCLib",
                    providerLyricsId: apiLyrics.id.toString(),
                    syncLyricsUri: "",
                    syncType: apiLyrics.syncedLyrics ? "LINE_SYNCED" : "UNSYNCED"
                }
            };

            LyricsDataBank.push({
                gid: gId,
                canonical_id: canonicalId,
                data: lyricsData
            });

            data.has_lyrics = true;

            return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        }
    }

    return f(...args);
};

const toggleFetchOverride = (toggle: boolean) => {
    window.fetch = toggle ? fetchOverride : f;
    console.log(`[SBL]: Fetch override is now ${toggle ? "enabled" : "disabled"}`);
    console.log(`[SBL]: Lyrics Data Bank has ${LyricsDataBank.length} entries`);
    console.log(LyricsDataBank);
};

export { toggleFetchOverride };
