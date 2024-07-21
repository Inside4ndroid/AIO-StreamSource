let url = 'null';

export async function getVideoDetails(Id, thumbsize) {
    try {
        if (thumbsize === 'small' || thumbsize === 'medium' || thumbsize === 'big') {
            url = process.env.EPORN_INFO + Id + '&thumbsize=' + thumbsize;
        } else {
            url = process.env.EPORN_INFO + Id;
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