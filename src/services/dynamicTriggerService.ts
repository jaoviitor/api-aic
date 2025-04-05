import axios from 'axios';
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

type HospitalHours = {
    id: number;
    hours: number[];
};

export async function getDynamicTriggerHours(): Promise<HospitalHours[]> {
    try{
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('hospital')
            .select('id, hoursCheck');

        if (error) {
            console.error(`Erro ao buscar horários: ${error.message}`);
            throw new Error('Não foi possível obter os horários dinâmicos');
        }
        if(!data || data.length === 0) {
            console.log('Nenhum horário encontrado');
            throw new Error('Unable to get dynamic schedules');
        }
        //const hoursString = data[0].hoursCheck;
        //const hoursArray = hoursString.split(',').map(hour =>parseInt(hour, 10));
        //const hoursArray: HospitalHours[] = data.map(record => ({
        //    id: record.id as number,
        //    hours: (record.hoursCheck as string).split(',').map(hour => parseInt(hour, 10))
        //}));

        const hoursArray = data
            .filter(record => record.hoursCheck)
            .map(record => ({
                id: record.id,
                hours: record.hoursCheck
                    .split(',')
                    .map((hour: string) => parseInt(hour.trim(), 10))
                    .filter((hour: number) => !isNaN(hour))
            }));
        return hoursArray;
    } catch (error) {
        console.error(`Error when fetching API times: ${error.message}`);
        throw new Error('Unable to get dynamic schedules');
    }
}