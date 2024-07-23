import 'dotenv/config';
import fastify from 'fastify';
import { META } from '@consumet/extensions';
import { getEPORN_CATEGORIES } from './src/eporner/Categories.js';
import { getVideoSources } from './src/eporner/Resolver.js';
import { getSearchResults } from './src/eporner/Search.js';
import { getVideoDetails } from './src/eporner/MediaDetails.js';
import { fetchSources } from './src/flixhq/flixhq.js';
import { getmovie, getserie } from './src/vidsrc/vidsrcto.js';
import { VidSrcExtractor, VidSrcExtractor2  } from './src/vidsrcme/vidsrcme.js';

const app = fastify();

const tmdbApi = process.env.TMDB_KEY;
const port = process.env.PORT;

app.get('/', async (request, reply) => {
    return {
        intro: "Welcome to the unofficial multi provider resolver and eporner api currently the ONLY All-In-One solution aswell as additional Eporner resolver.",
        documentation: "Please see github repo : https://github.com/Inside4ndroid/AIO-StreamSource",
        author: "This api is developed and created by Inside4ndroid"
    };
});

app.get('/vidsrc', async (request, reply) => {
    const id = request.query.id;
    const seasonNumber = parseInt(request.query.s, 10);
    const episodeNumber = parseInt(request.query.e, 10);
    const provider = request.query.provider;
    const thumbsize = request.query.thumbsize || 'medium';
    const resolve = request.query.resolve;
    const search = request.query.search;
    const per_page = request.query.per_page || '30';
    const page = request.query.page || '1';
    const order = request.query.order || 'latest';
    const gay = request.query.gay || '0';
    const lq = request.query.gay || '1';
    const cats = request.query.cats || null;
    const type = request.query.type || null;

    if (!provider) {
        return reply.status(400).send({ message: "The 'provider' query is required" });
    }

    const fetchFlixhq = async (id, seasonNumber, episodeNumber) => {
        let tmdb = new META.TMDB(tmdbApi);

        let type;

        if (seasonNumber && episodeNumber) {
            type = 'show';
        } else {
            type = 'movie';
        }

        try {
            const res = await tmdb.fetchMediaInfo(id, type);
            const mid = res.id;
            let episodeId;
            if (seasonNumber && episodeNumber) {
                const season = res.seasons.find(season => season.season === seasonNumber);
                if (!season) {
                    return reply.status(404).send({ message: 'Season not found' });
                }
                const episode = season.episodes.find(episode => episode.episode === episodeNumber);
                if (!episode) {
                    return reply.status(404).send({ message: 'Episode not found' });
                }
                episodeId = episode.id;
            } else {
                episodeId = res.episodeId;
            }
            const res1 = await fetchSources(episodeId, mid).catch((err) => {
                return reply.status(404).send({ message: err });
            });
            if (res1 && res) {
                const data = {
                    res,
                    data: res1
                };

                return reply.status(200).send(
                    data
                )
            } else {
                return reply.status(404).send({ message: 'Sources not found.' });
            }
        } catch (error) {
            return reply.status(500).send({ message: 'Something went wrong. Contact developer for help.' });
        }
    };

    const fetchVidsrc = async (id, seasonNumber, episodeNumber) => {
        let type;

        if (seasonNumber && episodeNumber) {
            type = 'show';
        } else {
            type = 'movie';
        }
        try {
            const res = await new META.TMDB(tmdbApi).fetchMediaInfo(id, type);
            if (seasonNumber && episodeNumber) {
                const response = await getserie(id, seasonNumber, episodeNumber);
                if (!response) {
                    return reply.status(404).send({ status: 404, return: "Sources not found." });
                } else {
                    const data = {
                        res
                    };
                    return reply.status(200).send([data, response]);
                }
            } else {
                const response = await getmovie(id);
                if (!response) {
                    return reply.status(404).send({ status: 404, return: "Sources not found." });
                } else {
                    const data = {
                        res
                    };
                    return reply.status(200).send([data, response]);
                }
            }
        } catch (error) {
            return reply.status(500).send({ message: 'Something went wrong. Contact developer for help.' });
        }
    };

    const fetchVidsrcMe = async (id, type) => {

        if (!type) {
            return reply.status(400).send({ message: "The 'type' query is required" });
        }

        const extractor = new VidSrcExtractor();
        const url = `https://vidsrc.net/embed/movie?tmdb=${id}`;
        const referer = null;
    
        try {
            const sources = [];
            const subtitles = [];
            const res = await new META.TMDB(tmdbApi).fetchMediaInfo(id, type);

            const subtitleCallback = (subtitleFile) => {
                console.log('Subtitle:', subtitleFile);
            };
    
            const linkCallback = (extractorLink) => {
                console.log('Extractor Link:', extractorLink);
                const data1 = {
                    res
                };
                sources.push({
                    url: extractorLink.url,
                    quality: extractorLink.quality,
                    isM3U8: extractorLink.isM3u8
                });

                const response = {
                    data: {
                        headers: {
                            Referer: extractorLink.referer
                        },
                        sources: sources,
                        subtitles: subtitles
                    }
                };
                return reply.status(200).send([data1, response]);
            };
    
            await extractor.getUrl(url, referer, subtitleCallback, linkCallback);
        } catch (error) {
            console.error('Error extracting URL:', error);
            reply.status(500).send('Internal Server Error');
        }
    };


    const fetchEporner = async (id, thumbsize, resolve, search, per_page, page, order, gay, lq) => {
        if (id) {
            const getDetails = await getVideoDetails(id, thumbsize);
            if (getDetails === null) {
                reply.status(404).send({
                    status: 404,
                    return: "Oops reached rate limit of this api"
                });
            } else {
                return reply.status(200).send(
                    [getDetails]
                )
            }
        }

        if (resolve) {
            const getSources = await getVideoSources(resolve);
            if (getSources === null) {
                reply.status(404).send({
                    status: 404,
                    return: "Oops reached rate limit of this api"
                });
            } else {
                return reply.status(200).send(
                    [getSources]
                )
            }
        }

        if (search) {
            const getResults = await getSearchResults(search, per_page, page, thumbsize, order, gay, lq);
            if (getResults === null) {
                reply.status(404).send({
                    status: 404,
                    return: "Oops reached rate limit of this api"
                });
            } else {
                return reply.status(200).send(
                    [getResults]
                )
            }
        }
    };

    const fetchEpornerCats = async () => {
        const getCats = await getEPORN_CATEGORIES();
        if (getCats === null) {
            reply.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            console.log(getCats);
            return reply.status(200).send(
                getCats
            )
        }
    }

    if (provider === 'flixhq') {
        await fetchFlixhq(id, seasonNumber, episodeNumber);
    } else if (provider === 'vidsrc') {
        await fetchVidsrc(id, seasonNumber, episodeNumber);
    } else if (provider === 'vidsrcme') {
        await fetchVidsrcMe(id, type);
    } else if (provider === 'eporner') {
        if (cats) {
            await fetchEpornerCats();
        } else {
            await fetchEporner(id, thumbsize, resolve, search, per_page, page, order, gay, lq);
        }
    }
    else {
        return reply.status(400).send({ message: 'Invalid provider specified' });
    }
});

const start = async () => {
    try {
        app.listen({ port: port });
        console.log(`AIO Streamer is listening on port http://localhost:${port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
