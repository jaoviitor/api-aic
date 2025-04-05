export async function fetchAuthToken(clientId: string, clientSecret: string) {
    try {
        const response = await fetch("https://login.microsoftonline.com/0837ea2e-6a9f-460b-8635-2bc1d5254d35/oauth2/v2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                scope: "api://5c2149ae-d9b3-49a3-8e3f-940bb3214e8d/.default",
                client_secret: clientSecret,
                grant_type: "client_credentials"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || "Erro ao obter token.");
        }

        return data;
    } catch (error: any) {
        throw new Error(`Èrro na requisição do token: ${error.message}`);
    }
}