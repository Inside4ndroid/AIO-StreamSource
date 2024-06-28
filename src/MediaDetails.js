import { detailsBase } from "./constants.js";

let url = 'null';

export async function getVideoDetails(Id, thumbsize) {
    try {
        if (thumbsize === 'small' || thumbsize === 'medium' || thumbsize === 'big') {
            url = detailsBase + Id + '&thumbsize=' + thumbsize;
        } else {
            url = detailsBase + Id;
        }

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