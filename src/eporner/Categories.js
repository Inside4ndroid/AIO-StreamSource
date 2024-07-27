import { EPORN_CATEGORIES } from "./values.js";

export async function getEPORN_CATEGORIES() {
    try {
        const json = {
            EPORN_CATEGORIES: EPORN_CATEGORIES
        };
        return json;
    } catch (err) {
        console.error(err);
        return null;
    }
}