import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export class VidSrcExtractor {
    constructor() {
        this.name = "VidSrc";
        this.mainUrl = "https://vidsrc.net";
        this.apiUrl = "https://vidsrc.stream";
        this.requiresReferer = false;
    }

    async fetchWithReferer(url, referer) {
        const response = await fetch(url, {
            headers: {
                'Referer': referer || ''
            }
        });
        const text = await response.text();
        const dom = new JSDOM(text);
        const document = dom.window.document;
        return { text, url: response.url, document };
    }

    async getUrl(url, referer, subtitleCallback, callback) {
        const iframedoc = await this.fetchWithReferer(url, null).then(res => res.document);

        const srcrcpList = Array.from(iframedoc.querySelectorAll("div.serversList > div.server")).map(server => {
            const datahash = server.getAttribute("data-hash");
            if (!datahash) return null;
            const rcpLink = `${this.apiUrl}/rcp/${datahash}`;
            return this.fetchWithReferer(rcpLink, this.apiUrl).then(rcpRes => {
                const srcrcpLink = /src:\s*'(.*)'/.exec(rcpRes.text)?.[1];
                return srcrcpLink ? `https:${srcrcpLink}` : null;
            });
        }).filter(Boolean);

        await Promise.all(srcrcpList.map(async (serverPromise) => {
            const server = await serverPromise;
            const res = await this.fetchWithReferer(server, this.apiUrl);
            if (res.url.includes("/prorcp")) {
                const encodedElement = res.document.querySelector("div#reporting_content+div");
                const decodedUrl = this.decodeUrl(encodedElement.getAttribute("id"), encodedElement.textContent);
                if (!decodedUrl) return;

                callback({
                    name: this.name,
                    source: this.name,
                    url: decodedUrl,
                    referer: this.apiUrl,
                    quality: Qualities.Unknown.value,
                    isM3u8: true
                });
            }
        }));
    }

    decodeUrl(encType, url) {
        switch (encType) {
            case "NdonQLf1Tzyx7bMG": return this.bMGyx71TzQLfdonN(url);
            case "sXnL9MQIry": return this.Iry9MQXnLs(url);
            case "IhWrImMIGL": return this.IGLImMhWrI(url);
            case "xTyBxQyGTA": return this.GTAxQyTyBx(url);
            case "ux8qjPHC66": return this.C66jPHx8qu(url);
            case "eSfH1IRMyL": return this.MyL1IRSfHe(url);
            case "KJHidj7det": return this.detdj7JHiK(url);
            case "o2VSUnjnZl": return this.nZlUnj2VSo(url);
            case "Oi3v1dAlaM": return this.laM1dAi3vO(url);
            case "TsA2KGDGux": return this.GuxKGDsA2T(url);
            case "JoAHUMCLXV": return this.LXVUMCoAHJ(url);
            default: return null;
        }
    }

    bMGyx71TzQLfdonN(a) {
        const b = 3;
        const c = [];
        for (let d = 0; d < a.length; d += b) {
            c.push(a.substring(d, Math.min(d + b, a.length)));
        }
        return c.reverse().join("");
    }

    Iry9MQXnLs(a) {
        const b = "pWB9V)[*4I`nJpp?ozyB~dbr9yt!_n4u";
        const d = a.match(/.{1,2}/g).map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
        let c = "";
        for (let e = 0; e < d.length; e++) {
            c += String.fromCharCode(d.charCodeAt(e) ^ b.charCodeAt(e % b.length));
        }
        let e = "";
        for (const ch of c) {
            e += String.fromCharCode(ch.charCodeAt(0) - 3);
        }
        return Buffer.from(e, 'base64').toString('utf8');
    }

    IGLImMhWrI(a) {
        const b = a.split("").reverse().join("");
        const c = b.split("").map(ch => {
            if (ch >= 'a' && ch <= 'm' || ch >= 'A' && ch <= 'M') return String.fromCharCode(ch.charCodeAt(0) + 13);
            if (ch >= 'n' && ch <= 'z' || ch >= 'N' && 'Z') return String.fromCharCode(ch.charCodeAt(0) - 13);
            return ch;
        }).join("");
        const d = c.split("").reverse().join("");
        return Buffer.from(d, 'base64').toString('utf8');
    }

    GTAxQyTyBx(a) {
        const b = a.split("").reverse().join("");
        const c = Array.from(b).filter((_, index) => index % 2 === 0).join("");
        return Buffer.from(c, 'base64').toString('utf8');
    }

    C66jPHx8qu(a) {
        const b = a.split("").reverse().join("");
        const c = "X9a(O;FMV2-7VO5x;Ao:dN1NoFs?j,";
        const d = b.match(/.{1,2}/g).map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
        let e = "";
        for (let i = 0; i < d.length; i++) {
            e += String.fromCharCode(d.charCodeAt(i) ^ c.charCodeAt(i % c.length));
        }
        return e;
    }

    MyL1IRSfHe(a) {
        const b = a.split("").reverse().join("");
        const c = b.split("").map(ch => String.fromCharCode(ch.charCodeAt(0) - 1)).join("");
        const d = c.match(/.{1,2}/g).map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
        return d;
    }

    detdj7JHiK(a) {
        const b = a.slice(10, a.length - 16);
        const c = "3SAY~#%Y(V%>5d/Yg\"\$G[Lh1rK4a;7ok";
        const d = Buffer.from(b, 'base64').toString('utf8');
        const e = c.repeat(Math.ceil(d.length / c.length)).slice(0, d.length);
        let f = "";
        for (let i = 0; i < d.length; i++) {
            f += String.fromCharCode(d.charCodeAt(i) ^ e.charCodeAt(i));
        }
        return f;
    }

    nZlUnj2VSo(a) {
        const b = {
            'x': 'a', 'y': 'b', 'z': 'c', 'a': 'd', 'b': 'e', 'c': 'f', 'd': 'g',
            'e': 'h', 'f': 'i', 'g': 'j', 'h': 'k', 'i': 'l', 'j': 'm', 'k': 'n',
            'l': 'o', 'm': 'p', 'n': 'q', 'o': 'r', 'p': 's', 'q': 't', 'r': 'u',
            's': 'v', 't': 'w', 'u': 'x', 'v': 'y', 'w': 'z', 'X': 'A', 'Y': 'B',
            'Z': 'C', 'A': 'D', 'B': 'E', 'C': 'F', 'D': 'G', 'E': 'H', 'F': 'I',
            'G': 'J', 'H': 'K', 'I': 'L', 'J': 'M', 'K': 'N', 'L': 'O', 'M': 'P',
            'N': 'Q', 'O': 'R', 'P': 'S', 'Q': 'T', 'R': 'U', 'S': 'V', 'T': 'W',
            'U': 'X', 'V': 'Y', 'W': 'Z'
        };
        return a.split("").map(ch => b[ch] || ch).join("");
    }

    laM1dAi3vO(a) {
        const b = a.split("").reverse().join("");
        const c = b.replace("-", "+").replace("_", "/");
        const d = Buffer.from(c, 'base64').toString('utf8');
        let e = "";
        const f = 5;
        for (const ch of d) {
            e += String.fromCharCode(ch.charCodeAt(0) - f);
        }
        return e;
    }

    GuxKGDsA2T(a) {
        const b = a.split("").reverse().join("");
        const c = b.replace("-", "+").replace("_", "/");
        const d = Buffer.from(c, 'base64').toString('utf8');
        let e = "";
        const f = 7;
        for (const ch of d) {
            e += String.fromCharCode(ch.charCodeAt(0) - f);
        }
        return e;
    }

    LXVUMCoAHJ(a) {
        const b = a.split("").reverse().join("");
        const c = b.replace("-", "+").replace("_", "/");
        const d = Buffer.from(c, 'base64').toString('utf8');
        let e = "";
        const f = 3;
        for (const ch of d) {
            e += String.fromCharCode(ch.charCodeAt(0) - f);
        }
        return e;
    }
}

export class VidSrcExtractor2 extends VidSrcExtractor {
    constructor() {
        super();
        this.mainUrl = "https://vidsrc.me";
    }
}

const Qualities = {
    Unknown: {
        value: 'HLS'
    }
};
