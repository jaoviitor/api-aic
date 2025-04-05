import { getStatisticsData } from "../services/statisticsService";

export async function handleStatisticsRequest(user: string, pass: string) {
    try{
        const statisticsData = await getStatisticsData(user, pass);
        return {
            status: 200,
            body: statisticsData,
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        return {
            status: 500,
            body: `Erro ao buscar estatísticas: ${error.message}`,
        };
    }
}