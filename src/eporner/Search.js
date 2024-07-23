
export async function getSearchResults(query, per_page, page, thumbsize, order, gay, lq) {
    try {
        const url = `https://www.eporner.com/api/v2/video/search/?query=${query}&per_page=${per_page}&page=${page}&thumbsize=${thumbsize}&order=${order}&gay=${gay}&lq=${lq}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        delete data.url;
        delete data.embed;
        
        const json = {
            details: data
        };
        return { json };
    } catch (err) {
        console.error(err);
        return null;
    }
}