import { Pool } from "pg";
import { connectToHospitalDb } from "../config/database";

export async function getStatisticsData(user: string, pass: string) {
    let pool: Pool | null = null;

    try{
        pool = await connectToHospitalDb(user, pass);

        const queryAndFormat = async (query: string, numericFields: string[] = []) => {
            const res = await pool.query(query);
            return res.rows.map(row => {
                numericFields.forEach(field => {
                    if (row[field] !== null && row[field] !== undefined) {
                        row[field] = Number(row[field]);
                    }
                });
                return row;
            });
        };

        return {
            cirurgiasPorMes: await queryAndFormat(`
                SELECT TO_CHAR(dtcirurgia, 'YYYY-MM') AS mes, COUNT(*) AS total
                FROM paciente
                GROUP BY mes
                ORDER BY mes;
            `, ["total"]),

            cirurgiasPorClinica: await queryAndFormat(`
                SELECT clinica, COUNT(*) AS total
                FROM paciente
                GROUP BY clinica;
            `, ["total"]),

            porcentagemTiposCirurgia: await queryAndFormat(`
                SELECT tipocirurgia, COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS porcentagem
                FROM paciente
                GROUP BY tipocirurgia;
            `, ["porcentagem"]),

            porcentagemInfeccao: await queryAndFormat(`
                SELECT 
                    (SELECT COUNT(*) FROM paciente WHERE cordia7 = 'vermelho' OR cordia11 = 'vermelho' OR cordia30 = 'vermelho') * 100.0 / 
                    (SELECT COUNT(*) FROM paciente WHERE cordia7 IS NOT NULL OR cordia11 IS NOT NULL OR cordia30 IS NOT NULL) AS infectados,
                    (SELECT COUNT(*) FROM paciente WHERE cordia7 = 'verde' OR cordia11 = 'verde' OR cordia30 = 'verde') * 100.0 / 
                    (SELECT COUNT(*) FROM paciente WHERE cordia7 IS NOT NULL OR cordia11 IS NOT NULL OR cordia30 IS NOT NULL) AS nao_infectados;
            `, ["infectados", "nao_infectados"]).then(res => res[0]),

            porcentagemSexo: await queryAndFormat(`
                SELECT sexo, COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS porcentagem
                FROM paciente
                GROUP BY sexo;
            `, ["porcentagem"]),

            infeccoesPorCirurgia: await queryAndFormat(`
                SELECT tipocirurgia, COUNT(*) AS total_infeccoes
                FROM paciente
                WHERE cordia7 = 'vermelho' OR cordia11 = 'vermelho' OR cordia30 = 'vermelho'
                GROUP BY tipocirurgia;
            `, ["total_infeccoes"]),

            faixaEtaria: await queryAndFormat(`
                SELECT 
                    CASE 
                        WHEN AGE(dtnascimento) < INTERVAL '19 years' THEN '0-18 anos'
                        WHEN AGE(dtnascimento) < INTERVAL '36 years' THEN '19-35 anos'
                        WHEN AGE(dtnascimento) < INTERVAL '51 years' THEN '36-50 anos'
                        WHEN AGE(dtnascimento) < INTERVAL '66 years' THEN '51-65 anos'
                        ELSE '66+ anos'
                    END AS faixa_etaria,
                    COUNT(*) AS total
                FROM paciente
                GROUP BY faixa_etaria;
            `, ["total"]),

            porcentagemInfeccaoPorClinica: await queryAndFormat(`
                SELECT clinica, 
                       COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS porcentagem
                FROM paciente
                WHERE cordia7 = 'vermelho' OR cordia11 = 'vermelho' OR cordia30 = 'vermelho'
                GROUP BY clinica;
            `, ["porcentagem"]),

            pacientesPorLocalidade: await queryAndFormat(`
                SELECT localidade, COUNT(*) AS total
                FROM paciente
                WHERE localidade IS NOT NULL
                GROUP BY localidade
                ORDER BY total DESC;
            `, ["total"]),
        };
    } catch (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}