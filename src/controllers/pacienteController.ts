import { Request, Response } from 'express';
import { listPacientes, insertPaciente } from "../services/pacienteService";
import { poolWrite } from '../config/database';

export const getPacientes = async (req: Request, res: Response): Promise<void> => {
    const user = req.headers['db-user'] as string;
    const pass = req.headers['db-pass'] as string;

    if (!user || !pass) {
        res.status(400).json({ error: "Missing database credentials" });
        return;
    }

    try {
        const result = await listPacientes(user, pass);

        res.status(200)
           .json(result);
    } catch(error: any) {
        res.status(500).json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const addPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;

        if (!body) {
            res.status(400).json({ error: "O corpo da requisição está vazio ou inválido" });
            return;
        }

        const result = await insertPaciente(body);

        res.status(201).json({
            message: "Paciente inserido com sucesso.",
            data: result,
        });
    } catch (error: any) {
        console.error(`Erro ao processar requisição: ${error.message}`);
        res.status(500).json({
            error: `Erro interno: ${error.message || 'Erro desconhecido'}`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const updatePaciente = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body as Record<string, any>;
        const { IdPaciente, ...updateFields } = body;

        if (!IdPaciente || typeof IdPaciente !== "number") {
            res.status(400).json({ error: "O campo 'IdPaciente' é obrigatório e deve ser um número." });
            return;
        }

        if (!updateFields || Object.keys(updateFields).length === 0) {
            res.status(400).json({ error: "Pelo menos um campo para atualização é necessário." });
            return;
        }

        const allowedFields = [
            "CorDia7", "CorDia11", "CorDia30", "contatado",
            "dia7observacao", "dia11observacao", "dia15observacao", 
            "dia30observacao", "dia45observacao", "dia60observacao", "dia90observacao"
        ];

        const invalidFields = Object.keys(updateFields).filter(key => !allowedFields.includes(key));

        if (invalidFields.length > 0) {
            res.status(400).json({ error: `Os seguintes campos não são permitidos: ${invalidFields.join(", ")}` });
            return;
        }
        
        const updates = Object.entries(updateFields).filter(([key, value]) => allowedFields.includes(key) && (key !== "contatado" || value === true));

        if (updates.length === 0) {
            res.status(400).json({ error: "Nenhuma coluna válida fornecida para atualização." });
            return;
        }

        const setClauses = updates.map(([key], index) => `${key} = $${index + 2}`).join(", ");
        const values = updates.map(([, value]) => value);

        const query = `
            UPDATE Public.Paciente
            SET ${setClauses}
            WHERE IdPaciente = $1
            RETURNING *;
        `;

        const result = await poolWrite.query(query, [IdPaciente, ...values]);

        if (result.rowCount === 0) {
            res.status(404).json({ error: "Paciente não encontrado." });
            return;
        }

        res.status(201).json({ message: "Atualização realizada com sucesso.", paciente: result.rows[0] });
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: `Erro interno: ${error.message}` });
    }
};