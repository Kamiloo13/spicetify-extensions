import { LyricCached, LyricsResponse, NowPlaylingSpotifyMetadata, SpMetadataFetch } from "./types/fetch";
import { error, log } from "./Logger";

export const fetchFunction = window.fetch;

const MAX_CACHE_SIZE = 100;
const KEY = "more-lyrics.cache-lyrics";
const LyricsDataBank: LyricCached[] = [];

let RequestCount = 0;
let CurrentRequestId = 0;

export const getFieldValue = <Type>(nameId: string) => {
    return JSON.parse(Spicetify.LocalStorage.get(`more-lyrics.${nameId}`) || "{}")?.value as Type | undefined;
};

const checkOverflow = () => {
    if (RequestCount > Number.MAX_SAFE_INTEGER - 1001) {
        RequestCount = 0;
    }

    if (CurrentRequestId > Number.MAX_SAFE_INTEGER - 1002) {
        CurrentRequestId = 0;
    }
};

const waitForTurn = async (myRequestId: number) => {
    const start = Date.now();
    while (myRequestId > CurrentRequestId) {
        if (Date.now() - start > 7500) throw new Error("Timeout in waitForTurn");
        await new Promise((res) => setTimeout(res, 100));
    }
};

const saveLyricsToCache = () => {
    Spicetify.LocalStorage.set(KEY, JSON.stringify(LyricsDataBank));
    log("Lyrics Data Bank saved to cache");
};

const addToCache = (data: LyricCached) => {
    if (!LyricsDataBank.some((x) => x.gid === data.gid)) {
        if (LyricsDataBank.length >= MAX_CACHE_SIZE) {
            LyricsDataBank.shift();
            log("Lyrics Data Bank overflowed, removing oldest entry");
        }

        LyricsDataBank.push(data);
        saveLyricsToCache();
    } else log(`Lyrics already exist in 'bank' <${data.gid}>`);
};

const clearLyricsCache = () => {
    LyricsDataBank.length = 0;
    Spicetify.LocalStorage.remove(KEY);
    log("Lyrics Data Bank cleared");
};

const loadLyricsFromCache = () => {
    const cachedData = Spicetify.LocalStorage.get(KEY);
    if (cachedData) {
        try {
            LyricsDataBank.length = 0;
            LyricsDataBank.push(...(JSON.parse(cachedData) as LyricCached[]));
            log("Lyrics Data Bank loaded from cache");
        } catch (e) {
            error("Error while parsing cached data. Clearing cache...", e);
            clearLyricsCache();
        }
    }
};

const fetchOverride = async (...args: [input: RequestInfo | URL, init?: RequestInit | undefined]): Promise<Response> => {
    const url = args[0];
    if (typeof url === "string") {
        if (url.startsWith("https://spclient.wg.spotify.com/color-lyrics/v2/track/")) {
            const canonicalId = url.split("/").at(6);

            if (!canonicalId) {
                error("Canonical ID not found in 'color-lyrics' fetch");
                return fetchFunction(...args);
            }

            checkOverflow();
            try {
                await waitForTurn(RequestCount++);
            } catch (e) {
                error(e);
                CurrentRequestId++;
                return fetchFunction(...args);
            }

            const lyrics = LyricsDataBank.find((x) => x.canonical_ids.includes(canonicalId));

            if (lyrics) {
                CurrentRequestId++;
                if (lyrics.data) {
                    log(`Lyrics found in 'bank' <${canonicalId}>`);
                    return new Response(JSON.stringify(lyrics.data), {
                        status: 200,
                        statusText: "OK",
                        headers: new Headers({
                            "Content-Type": "application/json"
                        })
                    });
                }
                log(`Lyrics were found in spotify as available <${canonicalId}>`);
                return fetchFunction(...args);
            }
            CurrentRequestId++;

            const nowPlaying = Spicetify.Queue.track?.contextTrack as NowPlaylingSpotifyMetadata;
            const nowPlayingId = nowPlaying?.uri?.split(":").at(-1);
            const nextPlaying = Spicetify.Queue.nextTracks?.[0]?.contextTrack as NowPlaylingSpotifyMetadata;
            const nextPlayingId = nextPlaying?.uri?.split(":").at(-1);
            const lastRecords = LyricsDataBank.filter((x) => x.metadata);

            if (nowPlayingId === canonicalId) {
                const foundRecord = lastRecords.find((x) => x.metadata?.artist_name === nowPlaying.metadata.artist_name && x.metadata?.title === nowPlaying.metadata.title);
                if (foundRecord) {
                    foundRecord.canonical_ids.push(canonicalId);
                    saveLyricsToCache();

                    log(`Lyrics found in 'bank' after parse <${canonicalId}>`);
                    return new Response(JSON.stringify(foundRecord.data), {
                        status: 200,
                        statusText: "OK",
                        headers: new Headers({
                            "Content-Type": "application/json"
                        })
                    });
                }
            } else if (nextPlayingId === canonicalId) {
                const foundRecord = lastRecords.find((x) => x.metadata?.artist_name === nextPlaying.metadata.artist_name && x.metadata?.title === nextPlaying.metadata.title);
                if (foundRecord) {
                    foundRecord.canonical_ids.push(canonicalId);
                    saveLyricsToCache();

                    log(`Lyrics found in 'bank' after parse <${canonicalId}>`);
                    return new Response(JSON.stringify(foundRecord.data), {
                        status: 200,
                        statusText: "OK",
                        headers: new Headers({
                            "Content-Type": "application/json"
                        })
                    });
                }
            }

            log(`Lyrics not found in 'bank' after parse <${canonicalId}>`);
            return fetchFunction(...args);
        } else if (url.startsWith("https://spclient.wg.spotify.com/metadata/4/track/")) {
            const gId = url.split("/").at(6)?.split("?").at(0);

            if (!gId) {
                error("GID not found in 'metadata' fetch");
                return fetchFunction(...args);
            }

            checkOverflow();
            try {
                await waitForTurn(RequestCount++);
            } catch (e) {
                error(e);
                CurrentRequestId++;
                return fetchFunction(...args);
            }

            const lyrics = LyricsDataBank.find((x) => x.gid === gId);

            if (lyrics) {
                CurrentRequestId++;
                if (lyrics.data) {
                    log(`Lyrics found in 'bank' when fetching for 'metadata' <${gId}>`);

                    const response = await fetchFunction(...args);
                    const data = (await response.clone().json()) as SpMetadataFetch;
                    data.has_lyrics = true;

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }

                log(`Lyrics found in 'bank' but no data when fetching for 'metadata' <${gId}>`);
                return fetchFunction(...args);
            }

            let response: Response;
            let data: SpMetadataFetch;
            try {
                response = await fetchFunction(...args);
                data = await response.clone().json();
            } catch (e) {
                error("Error while fetching metadata", e);
                CurrentRequestId++;
                return fetchFunction(...args);
            }

            const canonicalId = data.canonical_uri.split(":").at(-1)!;

            if (data.has_lyrics) {
                log(`Lyrics found in 'metadata' <${gId}>`);
                addToCache({
                    gid: gId,
                    canonical_ids: [canonicalId]
                });
                CurrentRequestId++;

                return response;
            }

            const token = getFieldValue<string>("api-token");
            const code = getFieldValue<string>("country-code");

            // Spotify username is used in here ONLY for the Ratelimitter to work properly (API key is not required but it disables the rate limiter)
            // If you want to use the API key, you can set it in the settings
            const apiResponse = await fetchFunction(
                `${getFieldValue<string>("api-endpoint") ?? "https://lyrics.kamiloo13.me/api"}/get?artist=${data.artist[0].name}&track=${data.name}&duration=${Math.round(
                    data.duration / 1000
                )}&album=${data.album.name}&username=${Spicetify.Platform.username}${code ? `&country=${code}` : ""}`,
                token
                    ? {
                          method: "GET",
                          headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                          }
                      }
                    : undefined
            ).catch(() => null);

            const apiLyrics = (await apiResponse?.json().catch(() => null)) as LyricsResponse | null;

            CurrentRequestId++;
            if (!apiLyrics || !apiResponse?.ok) {
                log(`Lyrics NOT found in 'lyrics.kamiloo13.me' <${gId}>`);

                addToCache({
                    gid: gId,
                    canonical_ids: [canonicalId]
                });

                return response;
            }

            log(`Lyrics found in 'lyrics.kamiloo13.me' <${gId}>`);

            const lyricsData: LyricCached["data"] = {
                colors: {
                    background: -10848593,
                    highlightText: -1,
                    text: -16777216
                },
                hasVocalRemoval: false,
                lyrics: {
                    alternatives: [],
                    capStatus: "NONE",
                    isDenseTypeface: false,
                    isRtlLanguage: false,
                    language: data.language_of_performance[0],
                    lines: apiLyrics.lines,
                    previewLines: apiLyrics.lines.slice(0, 5),
                    provider: apiLyrics.provider,
                    providerDisplayName: apiLyrics.providerLyricsDisplayName + " (more-lyrics)",
                    providerLyricsId: apiLyrics.providerLyricsId,
                    syncLyricsUri: "",
                    syncType: apiLyrics.isSynced ? "LINE_SYNCED" : "UNSYNCED"
                }
            };

            addToCache({
                gid: gId,
                canonical_ids: [canonicalId],
                data: lyricsData,
                metadata: {
                    artist_name: data.artist[0].name,
                    title: data.name
                }
            });

            data.has_lyrics = true;

            return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        }
    }

    return fetchFunction(...args);
};

const toggleFetchOverride = (toggle: boolean) => {
    window.fetch = toggle ? fetchOverride : fetchFunction;
    log(`Fetch override is now ${toggle ? "enabled" : "disabled"}`);
    log(`Lyrics Data Bank had ${LyricsDataBank.length} entries`, LyricsDataBank);

    if (toggle) {
        loadLyricsFromCache();

        RequestCount = 0;
        CurrentRequestId = 0;

        log(`Request count: ${RequestCount}`);
        log(`Current request ID: ${CurrentRequestId}`);
    } else {
        LyricsDataBank.length = 0;

        log(`Request count: ${RequestCount}`);
        log(`Current request ID: ${CurrentRequestId}`);

        RequestCount = Number.MAX_SAFE_INTEGER - 1000;
        CurrentRequestId = Number.MAX_SAFE_INTEGER - 1000;
    }

    log(`Lyrics Data Bank has now ${LyricsDataBank.length} entries`, LyricsDataBank);
};

export { toggleFetchOverride, clearLyricsCache };
