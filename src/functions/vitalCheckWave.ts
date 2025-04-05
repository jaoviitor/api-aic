import { app, InvocationContext, Timer } from "@azure/functions";
import { consumeWebhook } from "../services/webhookService";
import { getDynamicTriggerHours } from "../services/dynamicTriggerService";

export async function vitalCheckWave(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Timer function processed request.');

    const currentHour = new Date().getHours();

    try{
        const triggerHours = await getDynamicTriggerHours();

        for(const record of triggerHours) {
            if(record.hours.includes(currentHour)) {
                context.log(`Triggering the function at the sound time: ${currentHour}h`);
                await consumeWebhook(record.id);
                context.log('Webhook successfully consumed');
                return;
            }
        }

        context.log(`No execution required at this time. Current time: ${currentHour}`);

    } catch (error) {
        context.log(`Error getting timetables: ${error.message}`);
    }
}

app.timer('vitalCheckWave', {
    schedule: '0 * * * *',
    handler: vitalCheckWave
});
