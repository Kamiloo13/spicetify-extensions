import { LyricCached, LyricsResponse, SpMetadataFetch } from "../types/fetch";
import { log } from "./Logger";

const fetchFunction = window.fetch;

const MAX_CACHE_SIZE = 100;
const KEY = "simple-beautiful-lyrics:cache-lyrics";
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
    if (!LyricsDataBank.find((x) => x.canonical_id === data.canonical_id)) {
        if (LyricsDataBank.length >= MAX_CACHE_SIZE) {
            LyricsDataBank.shift();
            log("Lyrics Data Bank overflowed, removing oldest entry");
        }

        LyricsDataBank.push(data);
        saveLyricsToCache();
    } else log(`Lyrics already exist in 'bank' <${data.canonical_id}>`);
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
            console.error("[SBL]: Error while parsing cached data", e);
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
                console.error("[SBL]: Canonical ID not found in 'color-lyrics' fetch");
                return fetchFunction(...args);
            }

            checkOverflow();
            try {
                await waitForTurn(RequestCount++);
            } catch (e) {
                console.error("[SBL]:", e);
                CurrentRequestId++;
                return fetchFunction(...args);
            }

            const lyrics = LyricsDataBank.find((x) => x.canonical_id === canonicalId);
            CurrentRequestId++;

            if (lyrics && lyrics.data) {
                log(`Lyrics found in 'bank' <${canonicalId}>`);
                return new Response(JSON.stringify(lyrics.data), {
                    status: 200,
                    statusText: "OK",
                    headers: new Headers({
                        "Content-Type": "application/json"
                    })
                });
            }

            log(`Lyrics not found in 'bank' <${canonicalId}>`);
            return fetchFunction(...args);
        } else if (url.startsWith("https://spclient.wg.spotify.com/metadata/4/track/")) {
            const gId = url.split("/").at(6)?.split("?").at(0)!;

            if (!gId) {
                console.error("[SBL]: GID not found in 'metadata' fetch");
                return fetchFunction(...args);
            }

            checkOverflow();
            try {
                await waitForTurn(RequestCount++);
            } catch (e) {
                console.error("[SBL]:", e);
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

                log(`Lyrics found in 'bank' but no lyrics were available when fetching for 'metadata' <${gId}>`);
                return fetchFunction(...args);
            }

            const response = await fetchFunction(...args);
            const data = (await response.clone().json()) as SpMetadataFetch;
            const canonicalId = data.canonical_uri.split(":").at(-1)!;

            if (data.has_lyrics) {
                log(`Lyrics found in 'metadata' <${gId}>`);
                addToCache({
                    gid: gId,
                    canonical_id: canonicalId
                });
                CurrentRequestId++;

                return response;
            }

            const apiResponse = await fetchFunction(
                `https://lyrics.kamiloo13.me/api/get?artist=${data.artist[0].name}&track=${data.name}&duration=${Math.round(data.duration / 1000)}&album=${data.album.name}`
            ).catch(() => null);

            const apiLyrics = (await apiResponse?.json().catch(() => null)) as LyricsResponse | null;

            CurrentRequestId++;
            if (!apiLyrics || !apiResponse?.ok) {
                log(`Lyrics NOT found in 'lyrics.kamiloo13.me' <${gId}>`);

                addToCache({
                    gid: gId,
                    canonical_id: canonicalId
                });

                return response;
            }

            log(`Lyrics found in 'lyrics.kamiloo13.me' <${gId}>`);

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
                    lines: apiLyrics.lines,
                    previewLines: apiLyrics.lines.slice(0, 5),
                    provider: apiLyrics.provider,
                    providerLyricsDisplayName: apiLyrics.providerLyricsDisplayName,
                    providerLyricsId: apiLyrics.providerLyricsId,
                    syncLyricsUri: "",
                    syncType: apiLyrics.isSynced ? "LINE_SYNCED" : "UNSYNCED"
                }
            };

            addToCache({
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
