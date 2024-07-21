import 'dotenv/config';
import fastify from 'fastify';
import { META, PROVIDERS_LIST } from '@consumet/extensions';
import { getEPORN_CATEGORIES } from './src/Categories.js';
import { getVideoSources } from './src/Resolver.js';
import { getSearchResults } from './src/Search.js';
import { getVideoDetails } from './src/MediaDetails.js';
import { fetchSources } from './src/flixhq.js';

const app = fastify();

const tmdbApi = process.env.TMDB_KEY && process.env.TMDB_KEY;
const port = process.env.PORT;

app.get('/', async (request, reply) => {
    return {
        intro: "Welcome to the unofficial vidsrc and eporner api currently the ONLY All-In-One solution aswell as additional Eporner resolver.",
        documentation: "Please see github repo : https://github.com/Inside4ndroid/AIO-StreamSource",
        author: "This api is developed and created by Inside4ndroid"
    };
});

app.get('/vidsrc/:id', async (request, reply) => {
    const id = request.params.id;
    const type = request.query.type;
    const seasonNumber = parseInt(request.query.s, 10); // Convert to integer
    const episodeNumber = parseInt(request.query.e, 10);
    let tmdb = new META.TMDB(tmdbApi);

    if (!type) return reply.status(400).send({ message: "The 'type' query is required" });

    if (seasonNumber && episodeNumber) {
        try {
            const res = await tmdb.fetchMediaInfo(id, type);
            const mid = res.id;
            let episodeId;

            const season = res.seasons.find(season => season.season === seasonNumber);

            if (!season) {
                return reply.status(404).send({ message: 'Season not found' });
            }

            const episode = season.episodes.find(episode => episode.episode === episodeNumber);

            if (!episode) {
                return reply.status(404).send({ message: 'Episode not found' });
            }

            episodeId = episode.id;

            const res1 = await fetchSources(episodeId, mid).catch((err) => {
                reply.status(404).send({ message: err });
            });

            if (res1 && res) {
                reply.status(200).send([res, res1]);
            } else {
                reply.status(404).send({ message: 'Episode sources not found.' });
            }
        } catch (error) {
            reply.status(500).send({ message: 'Something went wrong. Contact developer for help.' });
        }

    } else {
        try {
            const res = await tmdb.fetchMediaInfo(id, type);
            const mid = res.id;
            const episodeId = res.episodeId;

            const res1 = await fetchSources(episodeId, mid).catch((err) => {
                reply.status(404).send({ message: err });
            });

            if (res1 && res) {
                reply.status(200).send([res, res1]);
            } else {
                reply.status(404).send({ message: 'Episode sources not found.' });
            }
        } catch (error) {
            reply.status(500).send({ message: 'Something went wrong. Contact developer for help.' });
        }
    }


});

// EPORNER API
app.get('/eporn/', async (request, reply) => {
    const { id, thumbsize, resolve, query, per_page, page, order, gay, lq } = request.query;

    if (id) {
        const getDetails = await getVideoDetails(id, thumbsize);
        if (getDetails === null) {
            reply.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            return [getDetails];
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
            return [getSources];
        }
    }

    if (query) {
        const getResults = await getSearchResults(query, per_page, page, thumbsize, order, gay, lq);
        if (getResults === null) {
            reply.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            return [getResults];
        }
    }
});

app.get('/eporn/cats', async (request, reply) => {
    const getCats = await getEPORN_CATEGORIES();
    if (getCats === null) {
        reply.status(404).send({
            status: 404,
            return: "Oops reached rate limit of this api"
        });
    } else {
        return getCats;
    }
});

// Start the Fastify server
const start = async () => {
    try {
        await app.listen({ port: port });
        console.log(`Example app listening on port http://localhost:${port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();