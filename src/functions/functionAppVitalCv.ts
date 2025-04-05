import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from 'axios';
import sharp from 'sharp';
import { BlobServiceClient } from '@azure/storage-blob';
import { Client } from 'pg';

export async function functionAppVitalCv(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const CONNECT_STR = process.env.CV_CONNECT_STR || '';
    const CONTAINER_NAME = process.env.CV_CONTAINER_NAME || '';
    const BLOB_SERVICE_CLIENT = BlobServiceClient.fromConnectionString(CONNECT_STR);

// Configuração do Banco de Dados
    const HOST = process.env.CV_HOST || '';
    const PORT = process.env.CV_PORT || '';
    const USER = process.env.CV_USER || '';
    const PASSWORD = process.env.CV_PASSWORD || '';
    const DATABASE = process.env.CV_DATABASE || '';
    const DB_CONFIG = {
        host: HOST,
        port: parseInt(PORT),
        database: DATABASE,
        user: USER,
        password: PASSWORD
    };

    /**
    * Obtém todas as avaliações do banco de dados
    */
    async function getAllEvaluationsFromDb() {
        // Query para selecionar todas as avaliações
        const query = "SELECT * FROM public.evaluation";
    
        let client: Client | null = null;
        try {
            // Conectar ao banco de dados
            client = new Client(DB_CONFIG);
            await client.connect();
        
            // Executar a query
            const result = await client.query(query);
        
            // Retornar os dados encontrados
            return result.rows;
        } catch (e) {
            console.error(`Erro ao recuperar dados: ${e}`);
            return null;
        } finally {
            if (client) {
            await client.end();
            }
        }
    }

    interface DadosPaciente {
        nome: string;
        prontuario: string;
        sexo: string;
        dtnascimento: string;
        dtcirurgia: string;
        tipocirurgia: string;
        clinica: string;
    }

    /**
    * Insere uma avaliação no banco de dados
    */
    async function insertEvaluationToDb(data: any, dadosPaciente: DadosPaciente) {
        const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
    
        // Extrai o nome da imagem
        const idImg = dataObj.blob_image_url.split("/").pop(); // Extrai nome da imagem
        const idPaciente = parseInt(dataObj.Wound_1.id_patient);
    
        let tipoPele = "";
        if (dataObj.wound_classification.type_skin && dataObj.wound_classification.type_skin.length > 0) {
            tipoPele = dataObj.wound_classification.type_skin[0]?.tagName || "";
        }
    
        let tipoFerida = "";
        if (dataObj.Wound_1.type_wound) {
            tipoFerida = dataObj.Wound_1.type_wound;
        }
    
        const membro = dataObj.wound_classification.type_member[0].tagName;
        const descricao = JSON.stringify(dataObj);  // Armazena JSON completo na coluna descricao
    
        // Conversão de percentual para formato numérico correto
        const amareloPercent = dataObj.Wound_1.yellow;
        const pretoPercent = dataObj.Wound_1.black;
        const vermelhoPercent = dataObj.Wound_1.red;
    
        // Query para verificar se o paciente existe
        const checkQuery = "SELECT 1 FROM paciente WHERE idpaciente = $1";

        // Query para inserir o paciente se não existir
        const insertPacienteQuery = `
        INSERT INTO paciente (idpaciente, nome, prontuario, sexo, dtnascimento, dtcirurgia, tipocirurgia, clinica)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (idpaciente) DO NOTHING
        `;
    
        // Query de Inserção
        const query = `
        INSERT INTO public.evaluation (
            idimg, amarelopercent, pretopercent, vermelhopercent,
            tipopele, tipoferida, membro, descricao, idpaciente
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
    
        let client: Client | null = null;
        try {
            client = new Client(DB_CONFIG);
            await client.connect();
        
            // Verifica se o paciente existe
            const existsResult = await client.query(checkQuery, [idPaciente]);
            const exists = existsResult.rowCount > 0;

            if (!exists) {
                await client.query(insertPacienteQuery, [
                    idPaciente, 
                    dadosPaciente.nome, 
                    dadosPaciente.prontuario, 
                    dadosPaciente.sexo, 
                    dadosPaciente.dtnascimento, 
                    dadosPaciente.dtcirurgia, 
                    dadosPaciente.tipocirurgia, 
                    dadosPaciente.clinica
                ]);
            }
        
            // Inserção na tabela evaluation
            await client.query(query, [
                idImg, 
                amareloPercent, 
                pretoPercent, 
                vermelhoPercent,
                tipoPele, 
                tipoFerida, 
                membro, 
                descricao, 
                idPaciente
            ]);

        } catch (e) {
            console.error(`Erro ao inserir no banco: ${e}`);
            throw new Error(`Erro ao inserir no banco: ${e}`);
        } finally {
            if (client) {
            await client.end();
            }
        }
    }

    /**
    * Salva uma imagem no Azure Blob Storage
    */
    async function saveImageToBlobCv(imageBuffer: Buffer, filename: string): Promise<string> {
        const containerName = "aic-vision-scrap";
        const blobClient = BLOB_SERVICE_CLIENT.getContainerClient(containerName)
            .getBlockBlobClient(`api_vital_cv/${filename}`);

        await blobClient.uploadData(imageBuffer);
        return blobClient.url;
    }

    /**
 * Extrai as cores de uma imagem
 */
async function extractColor(imageBuffer: Buffer) {
    // Usando sharp para análise de imagem
    const { width, height } = await sharp(imageBuffer).metadata();
    const totalPixels = (width || 1) * (height || 1); // Evitando divisão por zero
    
    // Função auxiliar para contar pixels em um intervalo de cor específico
    const countPixelsInRange = async (lowerBound: number[], upperBound: number[]): Promise<number> => {
        const { data, info } = await sharp(imageBuffer)
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        let count = 0;
        const channels = info.channels;
        
        for (let i = 0; i < data.length; i += channels) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simplificação da conversão RGB para HSV e verificação de intervalo
            if (r >= lowerBound[0] && r <= upperBound[0] &&
                g >= lowerBound[1] && g <= upperBound[1] &&
                b >= lowerBound[2] && b <= upperBound[2]) {
                count++;
            }
        }
        
        return count;
    };
    
    // Contagem aproximada para as cores
    const redPixels = await countPixelsInRange([150, 0, 0], [255, 100, 100]) + 
                      await countPixelsInRange([150, 0, 0], [255, 100, 100]);
    const yellowPixels = await countPixelsInRange([150, 150, 0], [255, 255, 100]);
    const blackPixels = await countPixelsInRange([0, 0, 0], [50, 50, 50]);
    
    // Cálculo das frações
    const redFraction = redPixels / totalPixels;
    const yellowFraction = yellowPixels / totalPixels;
    const blackFraction = blackPixels / totalPixels;
    
    return {
        yellow: Number(yellowFraction.toFixed(7)),
        red: Number(redFraction.toFixed(7)),
        black: Number(blackFraction.toFixed(7))
    };
    };

    /**
 * Detecção de feridas usando a API Azure Custom Vision
 */
async function detectionWound(urlImage: string) {
    const url = "https://aiccustomvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/b75bbf4a-fc12-4256-911c-1b2b798837d1/detect/iterations/Model_detection_1/url";
    const predictionKey = "5240a0ab220c4fbbbff01fd50facee7e";
    
    const body = { Url: urlImage };
    const headers = {
        "Prediction-Key": predictionKey,
        "Content-Type": "application/json"
    };
    
    const response = await axios.post(url, body, { headers });
    return response.data;
}

/**
 * Classificação de membros usando a API Azure Custom Vision
 */
async function classificationMember(urlImage: string) {
    const url = "https://aiccustomvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/0b9e6a42-fb47-4d4c-a932-198f5f9fb83c/classify/iterations/Iteration2/url";
    const predictionKey = "5240a0ab220c4fbbbff01fd50facee7e";
    
    const body = { Url: urlImage };
    const headers = {
        "Prediction-Key": predictionKey,
        "Content-Type": "application/json"
    };
    
    const response = await axios.post(url, body, { headers });
    const prediction = response.data.predictions;
    const filteredData = prediction
        .filter((item: any) => item.probability > 0)
        .map((item: any) => ({ tagName: item.tagName, probability: item.probability }));
    
    return filteredData;
}

/**
 * Classificação de tipo de pele usando a API Azure Custom Vision
 */
async function classificationSkin(urlImage: string) {
    const url = "https://aiccustomvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/3bf04452-a39f-42d2-9a30-647bba4c9f00/classify/iterations/model_1_classification_skin/url";
    const predictionKey = "5240a0ab220c4fbbbff01fd50facee7e";
    
    const body = { Url: urlImage };
    const headers = {
        "Prediction-Key": predictionKey,
        "Content-Type": "application/json"
    };
    
    const response = await axios.post(url, body, { headers });
    const prediction = response.data.predictions;
    const filteredData = prediction
        .filter((item: any) => item.probability > 0)
        .map((item: any) => ({ tagName: item.tagName, probability: item.probability }));
    
    return filteredData;
}

/**
 * Classificação de feridas usando a API Azure Custom Vision
 */
async function classificationWound(urlImage: string) {
    const url = "https://aiccustomvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/bc325625-f845-4866-b4a2-e6258f07de5a/classify/iterations/model_1_classification_wound/url";
    const predictionKey = "5240a0ab220c4fbbbff01fd50facee7e";
    
    const body = { Url: urlImage };
    const headers = {
        "Prediction-Key": predictionKey,
        "Content-Type": "application/json"
    };
    
    const response = await axios.post(url, body, { headers });
    const prediction = response.data.predictions;
    const filteredData = prediction
        .filter((item: any) => item.probability > 0)
        .map((item: any) => ({ tagName: item.tagName, probability: item.probability }));
    
    return filteredData;
}

/**
 * Obtém uma imagem a partir de uma URL
 */
async function getImageFromUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    if (response.status === 200) {
        return Buffer.from(response.data);
    } else {
        throw new Error(`Erro ao baixar a imagem. Status code: ${response.status}`);
    }
}

try {
    const reqBody = await request.json() as {
        url: string;
        id: string;
        return_type?: string;
        nome: string;
        prontuario: string;
        sexo: string;
        dtnascimento: string;
        dtcirurgia: string;
        tipocirurgia: string;
        clinica: string;
    };
    
    const urlImage = reqBody.url;
    const idPatient = reqBody.id;
    const returnType = reqBody.return_type || "Full";
    
    // Recebendo todos os dados do paciente
    const nomePaciente = reqBody.nome;
    const prontuarioPaciente = reqBody.prontuario;
    const sexoPaciente = reqBody.sexo;
    const dtnascimentoPaciente = reqBody.dtnascimento;
    const dtcirurgiaPaciente = reqBody.dtcirurgia;
    const tipocirurgiaPaciente = reqBody.tipocirurgia;
    const clinicaPaciente = reqBody.clinica;
    
    if (!urlImage) {
        return { status: 400, body: "URL da imagem não foi fornecida." };
    }
    
    if (!idPatient) {
        return { status: 400, body: "ID do paciente não foi fornecido." };
    }
    
    // Criando o dicionário com os dados do paciente
    const dadosPaciente: DadosPaciente = {
        nome: nomePaciente,
        prontuario: prontuarioPaciente,
        sexo: sexoPaciente,
        dtnascimento: dtnascimentoPaciente,
        dtcirurgia: dtcirurgiaPaciente,
        tipocirurgia: tipocirurgiaPaciente,
        clinica: clinicaPaciente
    };
    
    // Baixar a imagem
    const imageBuffer = await getImageFromUrl(urlImage);
    const classificationInfo: any = {
        type_member: {},
        type_skin: {},
        class_wound: {}
    };
    
    // Obter as predições da API de classificação do membro
    const memberClassification = await classificationMember(urlImage);
    // Verifica se existe algum item com probabilidade >= 0.6
    const hasHighProbability = memberClassification.some((item: any) => item.probability >= 0.6);
    if (!hasHighProbability) {
        return { 
            status: 404, 
            body: "Nenhum membro detectado ou imagem não corresponde a um membro." 
        };
    }
    // pegar somente os itens com probabilidades maiores que 0.5 na classificação de membro
    const memberClassificationFilter = memberClassification.filter((item: any) => item.probability > 0.5);
    classificationInfo.type_member = memberClassificationFilter;
    
    if (returnType === "Dermatologic" || returnType === "Full") {
        // obter as predições da API de classificação da pele
        const skinClassification = await classificationSkin(urlImage);
        // pegar somente os itens com probabilidades maiores que 0.5 na classificação de pele
        const skinClassificationFilter = skinClassification.filter((item: any) => item.probability > 0.5);
        classificationInfo.type_skin = skinClassificationFilter;
    }
    
    if (returnType === "Wound" || returnType === "Full") {
        // obter as predições da API de classificação da ferida
        const woundClassification = await classificationWound(urlImage);
        // pegar somente os itens com probabilidades maiores que 0.5 na classificação de ferida
        const woundClassificationFilter = woundClassification.filter((item: any) => item.probability > 0.5);
        classificationInfo.class_wound = woundClassificationFilter;
    }
    
    // Obter as predições da API de detecção
    const detectionWoundPredict = await detectionWound(urlImage);
    const coresTags: Record<string, number[]> = {
        'Wound_Open': [255, 0, 0],
        'Woud_closed': [0, 255, 0],
        'tag3': [0, 0, 255]
    };

    // Processamento de imagem com Sharp
    const imageInfo = await sharp(imageBuffer).metadata();
    
    // Em Node, em vez de modificar a imagem como no Python,
    // vamos processar cada ferida detectada e extrair as informações necessárias
    const imgsInfo: Record<string, any> = {};
    let totalWounds = 0;
    
    for (const prediction of detectionWoundPredict.predictions) {
        if (prediction.probability < 0.8) {
            continue;
        }
        
        const bbox = prediction.boundingBox;
        const x = Math.floor(bbox.left * (imageInfo.width || 0));
        const y = Math.floor(bbox.top * (imageInfo.height || 0));
        const w = Math.floor(bbox.width * (imageInfo.width || 0));
        const h = Math.floor(bbox.height * (imageInfo.height || 0));
        
        // Recortar a região da ferida
        const croppedImageBuffer = await sharp(imageBuffer)
            .extract({ left: x, top: y, width: w, height: h })
            .toBuffer();
        
        // Extrair percentuais de cores
        const colorPercentages = await extractColor(croppedImageBuffer);
        
        const imgInfo = {
            type_wound: prediction.tagName,
            probability: prediction.probability,
            red: colorPercentages.red,
            yellow: colorPercentages.yellow,
            black: colorPercentages.black,
            id_patient: idPatient
        };
        
        const imgId = `Wound_${totalWounds + 1}`;
        imgsInfo[imgId] = imgInfo;
        totalWounds++;
    }
    
    if (totalWounds === 0) {
        return { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' },
            body: "Nenhuma ferida detectada ou imagem não corresponde a ferida."
        };
    }
    
    // Salvar a imagem no blob storage
    const blobImage = await saveImageToBlobCv(imageBuffer, `img_${idPatient}.jpg`);
    
    imgsInfo.wound_classification = classificationInfo;
    imgsInfo.total_wounds_found = totalWounds;
    imgsInfo.blob_image_url = blobImage;
    
    await insertEvaluationToDb(imgsInfo, dadosPaciente);
    
    return { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imgsInfo)
    };
    
} catch (error: any) {
    context.log(`Erro: ${error.message}`);
    return { 
        status: 500, 
        body: `Erro: ${error.message}`
    };
}

};

app.http('functionAppVitalCv', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: functionAppVitalCv
});
