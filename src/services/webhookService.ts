import axios from 'axios';

export async function consumeWebhook(hospitalId: number): Promise<void> {
    const webhookUrl = process.env.N8N_WEBHOOK;
    try{
        const response = await axios.post(webhookUrl, 
            { id: hospitalId},
            {
            headers: {
                'aicuryhc': 'gMCgs6GoXikEuuDQMsN7XnTF0ZZ7gp0X',
                'Content-Type': 'application/json'
            }
        });
        console.log(`Webhook successfully consumed, status: ${response.status}`);
    } catch (error) {
        console.error(`Error consuming the webhook: ${error.message}`);
    }
}