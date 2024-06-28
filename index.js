import express from "express";
import { getVidsrcSourcesId, getVidsrctoStreams } from "./src/vidsrcto.js";
import { port } from "./src/constants.js";
import { webcrack } from "webcrack";
import { Deobfuscator } from "deobfuscator";
import fetch from "node-fetch";
import { assert } from "console";
import { writeFile } from "node:fs/promises";
import { getCategories } from "./src/Categories.js";
import { getVideoSources } from "./src/Resolver.js";
import { getSearchResults } from "./src/Search.js";
import { getVideoDetails } from "./src/MediaDetails.js";

const app = express();

app.get('/', (req, res) => {
    res.status(200).json({
        intro: "Welcome to the unofficial vidsrc and eporner api currently the ONLY All-In-One solution aswell as additional Eporner resolver.",
        documentation: "Please see github repo : ",
        author: "This api is developed and created by Inside4ndroid"
    });
});

app.get('/vidsrc/:tmdbId', async (req, res) => {
    const id = req.params.tmdbId;
    const season = req.query.s;
    const episode = req.query.e;

    const sourcesId = await getVidsrcSourcesId(id, season, episode);
    const response = await getVidsrctoStreams(sourcesId);
    const responseData = response.data;
    if (responseData.file === null) {
        res.status(404).send({
            status: 404,
            return: "Oops reached rate limit of this api"
        });
    } else {
        res.status(200).json([response]);
    }
});

app.get('/eporn/', async (req, res) => {

    // http://localhost:3000/eporn/?id=IsabYDAiqXa&thumbsize=big
    // http://localhost:3000/eporn/?resolve=IsabYDAiqXa

    const id = req.query.id || null;
    const thumbsize = req.query.thumbsize || 'medium';
    const resolve = req.query.resolve || null;

    const query = req.query.query || null;
    const per_page = req.query.per_page || '30';
    const page = req.query.page || '1';
    const order = req.query.order || 'latest';
    const gay = req.query.gay || '0';
    const lq = req.query.lq || '1';

    if (id) {
        const getDetails = await getVideoDetails(id, thumbsize);
        if (getDetails === null) {
            res.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            res.status(200).json([getDetails]);
        }
    }

    if (resolve) {
        const getSources = await getVideoSources(resolve);
        if (getSources === null) {
            res.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            res.status(200).json([getSources]);
        }
    }

    if(query) {
        const getResults = await getSearchResults(query, per_page, page, thumbsize, order, gay, lq);
        if(getResults === null) {
            res.status(404).send({
                status: 404,
                return: "Oops reached rate limit of this api"
            });
        } else {
            res.status(200).json([getResults]);
        }
    }
});

app.get('/eporn/cats', async (req, res) => {
    const getCats = await getCategories();
    if (getCats === null) {
        res.status(404).send({
            status: 404,
            return: "Oops reached rate limit of this api"
        });
    } else {
        res.status(200).json(getCats);
    }
});

async function deobfuscationChain(obfuscatedScript, deobfsSteps) {
    let deobfs = obfuscatedScript;
    for (const func of deobfsSteps) {
        deobfs = await deobfuscationLoop(deobfs, func);
    }
    return deobfs;
}

async function deobfuscationLoop(obfuscatedInput, loopFunction) {
    let deobfuscated = obfuscatedInput;
    for (let run = 0; run < 5; run++) {
        try {
            const result = await loopFunction(deobfuscated);
            if (result == "" || result == undefined) break;
            deobfuscated = result;
        } catch (e) {
            console.error(e);
            break;
        }
    }
    return deobfuscated;
}

const synchrony = new Deobfuscator();
const webcrackStep = async (x) => await webcrack(x).code;
const synchronyStep = async (x) => await synchrony.deobfuscateSource(x);
const checkDeobfs = (x) => x.indexOf("<video />") !== -1;
let obfuscatedScript;
let deobfuscatedScript;

async function getDeobfuscatedScript() {
    while (true) {
        const result = await webcrack(obfuscatedScript, {
            jsx: true,
            unpack: true,
            unminify: true,
            deobfuscate: true,
            mangle: false,
        });

        deobfuscatedScript = result.code;

        const result2 = await webcrack(deobfuscatedScript, {
            jsx: true,
            unpack: true,
            unminify: true,
            deobfuscate: true,
            mangle: false,
        });

        deobfuscatedScript = result2.code;

        const result3 = await webcrack(deobfuscatedScript, {
            jsx: true,
            unpack: true,
            unminify: true,
            deobfuscate: true,
            mangle: false,
        });

        deobfuscatedScript = result3.code;

        deobfuscatedScript = await deobfuscationChain(deobfuscatedScript, [webcrackStep, synchronyStep]);

        console.log(deobfuscatedScript);

        if (checkDeobfs(deobfuscatedScript)) {
            return deobfuscatedScript;
        } else {
            obfuscatedScript = deobfuscatedScript;
        }
    }
}

async function run() {
    const vidplayHost = "https://vidplay.online";
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/120.0",
        "Referer": vidplayHost + "/e/",
        "Origin": vidplayHost
    };

    const vidplayHtml = await fetch(`${vidplayHost}/e/`, { headers }).then(async (x) => await x.text());
    const codeVersion = vidplayHtml.match(/embed.js\?v=(\w+)/)[1];
    const scriptUrl = `${vidplayHost}/assets/mcloud/min/embed.js?v=${codeVersion}`;

    obfuscatedScript = await fetch(scriptUrl, { headers }).then(async (x) => await x.text());

    const deobfuscated = await getDeobfuscatedScript();

    if (checkDeobfs(deobfuscated)) {
        const start = deobfuscated.substring(deobfuscated.indexOf("<video />"));
        const end = start.substring(0, start.indexOf(".replace"));
        const keys = Array.from(end.matchAll(/'(\w+)'/g), x => x[1]);
        assert(keys.length == 2, "Invalid array length!");

        console.info("Success!");
        await writeFile("keys.json", JSON.stringify(keys), "utf8");
    } else {
        console.error("FAIL!");
        await writeFile("failed.js", deobfuscated, "utf8");
    }
}

//run();

// Run the function every 2 hours
setInterval(run, 2 * 60 * 60 * 1000);

// Start the Express server
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
});