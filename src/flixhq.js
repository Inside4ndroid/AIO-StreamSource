import { StreamingServers, MixDrop, VidCloud } from '@consumet/extensions';
import cheerio from 'cheerio';

import axios from 'axios';

const baseUrl = 'https://flixhq.to';
const client = axios.create();

/**
 * 
 * @param {string} episodeId episode id
 * @param {string} mediaId media id
 * @returns {Promise<Object>} the sources and headers for the episode
 */

export async function fetchSources(episodeId, mediaId) {

    const server = StreamingServers.UpCloud;

    if (episodeId.startsWith('http')) {
        const serverUrl = new URL(episodeId);
        switch (server) {
            case StreamingServers.MixDrop:
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new MixDrop().extract(serverUrl),
                };
            case StreamingServers.VidCloud:
                return {
                    headers: { Referer: serverUrl.href },
                    ...(await new VidCloud().extract(serverUrl, true)),
                };
            case StreamingServers.UpCloud:
                return {
                    headers: { Referer: serverUrl.href },
                    ...(await new VidCloud().extract(serverUrl)),
                };
            default:
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new MixDrop().extract(serverUrl),
                };
        }
    }
    try {
        const servers = await fetchServers(episodeId, mediaId);
        const i = servers.findIndex(s => s.name === server);
        if (i === -1) {
            throw new Error(`Server ${server} not found`);
        }
        const { data } = await client.get(`${baseUrl}/ajax/get_link/${servers[i].url.split('.').slice(-1).shift()}`);
        const serverUrl = new URL(data.link);
        return await fetchSources(serverUrl.href, mediaId, server, fetchServers, baseUrl, client);
    } catch (err) {
        throw new Error(err.message);
    }
}

/**
 * 
 * @param {string} episodeId takes episode link or movie id
 * @param {string} mediaId takes movie link or id (found on movie info object)
 * @returns {Promise<Array>} an array of server objects
 */
export async function fetchServers(episodeId, mediaId) {
    if (!episodeId.startsWith(`${baseUrl}/ajax`) && !mediaId.includes('movie')) {
        episodeId = `${baseUrl}/ajax/v2/episode/servers/${episodeId}`;
    } else {
        episodeId = `${baseUrl}/ajax/movie/episodes/${episodeId}`;
    }

    try {
        const { data } = await client.get(episodeId);
        const $ = cheerio.load(data);
        const servers = $('.nav > li')
            .map((i, el) => {
                const server = {
                    name: mediaId.includes('movie')
                        ? $(el).find('a').attr('title').toLowerCase()
                        : $(el).find('a').attr('title').slice(6).trim().toLowerCase(),
                    url: `${baseUrl}/${mediaId}.${!mediaId.includes('movie')
                        ? $(el).find('a').attr('data-id')
                        : $(el).find('a').attr('data-linkid')}`.replace(
                        !mediaId.includes('movie') ? /\/tv\// : /\/movie\//,
                        !mediaId.includes('movie') ? '/watch-tv/' : '/watch-movie/'
                    ),
                };
                return server;
            })
            .get();
        return servers;
    } catch (err) {
        throw new Error(err.message);
    }
}