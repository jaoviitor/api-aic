import { Pool } from "pg";
import { UpdatePacienteRequest } from "../types/pacienteTypes";
import { pool, poolWrite, connectToHospitalDb } from "../config/database";

export async function listPacientes(user: string, pass: string) {
    let pool: Pool | null = null;

    try {
        pool = await connectToHospitalDb(user, pass);
        const result = await pool.query(`
            SELECT 
                p.*,
                n.*,
                r.*
            FROM 
                Paciente p
            LEFT JOIN 
                Numero n
            ON 
                p.IdPaciente = n.IdPaciente
            LEFT join
	            Resposta r 
            ON 
   	            p.idpaciente = r.idpaciente;
        `);
        return result.rows;
    } catch (error) {
        throw new Error(`Error accessing database: ${error.message}`);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

export async function updatePaciente(body: UpdatePacienteRequest) {
    const fields = Object.keys(body).filter(key => key !== 'idPaciente'); // Remove o idPaciente
    const setClauses = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    if (!setClauses) {
        throw new Error("Nenhum campo válido para atualização foi fornecido.");
    }

    const query = `
        UPDATE Paciente
        SET ${setClauses}
        WHERE idPaciente = $1
        RETURNING *;
    `;

    const values = [body.idPaciente, ...fields.map(field => body[field])];

    try {
        const result = await pool.query(query, values);

        // Se não encontrou o paciente
        if (result.rowCount === 0) {
            throw new Error(`Paciente com id ${body.idPaciente} não encontrado.`);
        }

        return result.rows[0]; // Retorna os dados do paciente atualizado
    } catch (error) {
        throw new Error(`Erro ao atualizar paciente: ${error.message}`);
    }
}

export async function insertPaciente(pacienteData: any) {
    const {
        Nome,
        DtNascimento,
        Sexo,
        Prontuario,
        Clinica,
        TipoCirurgia,
        DtCirurgia,
        Anamnese,
        NumTelefone,
        NumTelefone2,
        NumTelefone3,
        NumTelefone4,
      } = pacienteData;
      const client = await poolWrite.connect();

      try{
        await client.query("BEGIN");

        const pacienteQuery = `
            INSERT INTO public.paciente (
                nome, dtnascimento, sexo, prontuario, clinica, tipocirurgia, dtcirurgia, anamnese, mainnumber
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING idpaciente;
        `;

        const pacienteValues = [
            Nome,
            DtNascimento,
            Sexo,
            Prontuario,
            Clinica,
            TipoCirurgia,
            DtCirurgia,
            Anamnese,
            NumTelefone,
        ];
        const pacienteResult = await client.query(pacienteQuery, pacienteValues);
        const idPaciente = pacienteResult.rows[0].idpaciente;
        const numeroQuery = `
            INSERT INTO public.numero (
                numtelefone, numtelefone2, numtelefone3, numtelefone4,
                whatsappligacao, whatsappligacao2, mainnumber, idpaciente
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const numeroValues = [
            NumTelefone || null,
            NumTelefone2 || null,
            NumTelefone3 || null,
            NumTelefone4 || null,
            true,
            true,
            NumTelefone,
            idPaciente,
        ];

        const numeroResult = await client.query(numeroQuery, numeroValues);

        await client.query("COMMIT");

        return {
            paciente: { idpaciente: idPaciente, ...pacienteData},
            numero: numeroResult.rows[0],
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Erro ao inserir paciente: ${error.message}`);
      } finally {
        client.release();
      }
}