import { Request, Response } from 'express';
import axios from 'axios';

export const getCep = async (req: Request, res: Response): Promise<void> => {
    const cep = req.params.cep;
    const cepRegex = /^[0-9]{8}$/;

    if (!cep) {
        res.status(400).json({ error: "Missing CEP" });
        return;
    }

    if (!cepRegex.test(cep)) {
        res.status(400).json({ error: "CEP inválido. Informe um CEP com 8 dígitos numéricos." });
        return;
    }

    try {
        const result = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (result.data.erro) {
            res.status(404).json({ error: "CEP não encontrado." });
            return;
        }

        res.status(200).json(result.data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar informações do CEP." });
    }
};