import { getRequests, getGeral } from "../services/requestService";

export async function handleGetRequest() {
    try {
        const requests = await getRequests();
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: requests,
        };
    } catch (error) {
        return {
            status: 500,
            body: `Error when searching for patients: ${error.message}`,
        };
    }
}

export async function handleGetGeral() {
    try {
        const geral = await getGeral();
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: geral,
        };
    } catch (error) {
        return {
            status: 500,
            body: `Error when searching for patients: ${error.message}`,
        };
    }
}