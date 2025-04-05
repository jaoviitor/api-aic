import { getPacientes } from "../services/pacienteService";

export async function handleGetPacientes(user: string, pass: string) {
    try {
        const pacientes = await getPacientes(user, pass);
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: pacientes,
        };
    } catch (error) {
        return {
            status: 500,
            body: `Error when searching for patients: ${error.message}`,
        };
    }
}