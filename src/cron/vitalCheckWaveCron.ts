import cron from 'node-cron';
import { consumeWebhook } from "../services/webhookService";
import { getDynamicTriggerHours } from "../services/dynamicTriggerService";

export async function executeVitalCheck(): Promise<void> {
    console.log('Verificando horários para execução de webhooks...');

    const currentHour = new Date().getHours();

    try {
        const triggerHours = await getDynamicTriggerHours();

        for (const record of triggerHours) {
            if (record.hours.includes(currentHour)) {
                console.log(`Disparando webhook no horário programado: ${currentHour}h`);
                await consumeWebhook(record.id);
                console.log('Webhook executado com sucesso');
                return;
            }
        }

        console.log(`Nenhuma execução necessária neste momento. Hora atual: ${currentHour}`);

    } catch (error: any) {
        console.error(`Erro ao obter tabelas de horários: ${error.message}`);
    }
};

export function initVitalCheckScheduler(): void {
    cron.schedule('0 * * * *', async () => {
        try {
            await executeVitalCheck();
        } catch (error: any) {
            console.error(`Erro na execução agendada: ${error.message}`);
        }
    });
    
    console.log('Agendamento do VitalCheck inicializado com sucesso');
};

export function executeVitalCheckOnStartup(): void {
    setTimeout(async () => {
        try {
            console.log('Executando verificação inicial do VitalCheck...');
            await executeVitalCheck();
        } catch (error: any) {
            console.error(`Erro na execução inicial: ${error.message}`);
        }
    }, 5000);
};