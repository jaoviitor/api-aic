import { poolAiScribe } from "../config/database";
import { BlobServiceClient } from "@azure/storage-blob";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import dotenv from "dotenv";
import axios from 'axios';
import { PassThrough } from 'stream';

dotenv.config();

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export const getMeetingsWithDetails = async () => {
    const client = await poolAiScribe.connect();
    try {
      const query = `
        SELECT 
            "Meeting".*,
            JSON_AGG(DISTINCT "Task") AS tasks,
            JSON_AGG(DISTINCT "Decision") AS decisions,
            JSON_AGG(DISTINCT "Question") AS questions,
            JSON_AGG(DISTINCT "Insight") AS insights,
            JSON_AGG(DISTINCT "Deadline") AS deadlines,
            JSON_AGG(DISTINCT "Attendee") AS attendees,
            JSON_AGG(DISTINCT "FollowUp") AS followUps,
            JSON_AGG(DISTINCT "Risk") AS risks,
            JSON_AGG(DISTINCT "AgendaItem") AS agendaItems
        FROM "Meeting"
        LEFT JOIN "Task" ON "Task"."meetingId" = "Meeting"."id"
        LEFT JOIN "Decision" ON "Decision"."meetingId" = "Meeting"."id"
        LEFT JOIN "Question" ON "Question"."meetingId" = "Meeting"."id"
        LEFT JOIN "Insight" ON "Insight"."meetingId" = "Meeting"."id"
        LEFT JOIN "Deadline" ON "Deadline"."meetingId" = "Meeting"."id"
        LEFT JOIN "Attendee" ON "Attendee"."meetingId" = "Meeting"."id"
        LEFT JOIN "FollowUp" ON "FollowUp"."meetingId" = "Meeting"."id"
        LEFT JOIN "Risk" ON "Risk"."meetingId" = "Meeting"."id"
        LEFT JOIN "AgendaItem" ON "AgendaItem"."meetingId" = "Meeting"."id"
        GROUP BY "Meeting"."id";
      `;
  
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    } finally {
      client.release();
    }
  };

  export async function createMeeting(meetingData: any) {
    const { name, description, rawTranscript, summary } = meetingData;

    if (!name || !description || !rawTranscript || !summary) {
        throw new Error("Todos os campos são obrigatórios");
      }

    const client = await poolAiScribe.connect();
    try {
        const meetingQuery = `
            INSERT INTO "Meeting" ("name", "description", "rawTranscript", "summary")
            VALUES ($1, $2, $3, $4)
            RETURNING *;
    `;

    const meetingResult = await client.query(meetingQuery, [
        name,
        description,
        rawTranscript,
        summary,
    ]);
  
    return meetingResult.rows[0];
    } catch (error) {
      throw new Error(`Erro ao inserir reunião: ${error.message}`);
    } finally {
      client.release();
    }
  }

export const getMeetingsLeadsVenda = async () => {
    const client = await poolAiScribe.connect();

    try {
      const query = `SELECT * FROM public.leads_venda;`
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    } finally {
      client.release();
    }
};

export const transcribeAudioFromBlob = async (fileName: string): Promise<string> => {
  const CONTAINER_NAME = "aic-aiscribes";
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blobClient = containerClient.getBlobClient(fileName);
  const downloadResponse = await blobClient.download();
  const chunks: Buffer[] = [];
  for await (const chunk of downloadResponse.readableStreamBody!) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as Uint8Array));
  }
  const audioBuffer = Buffer.concat(chunks);
  console.log(`Áudio baixado com ${audioBuffer.length} bytes`);
  
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const tempMp3Path = path.join(tempDir, `${uuidv4()}.mp3`);
    const tempWavPath = path.join(tempDir, `${uuidv4()}.wav`);
    fs.writeFileSync(tempMp3Path, audioBuffer);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempMp3Path)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('start', (commandLine) => {
          console.log('Iniciando conversão com comando: ' + commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Progresso: ${progress.percent}%`);
        })
        .on('end', () => {
          console.log('Conversão concluída com sucesso');
          resolve();
        })
        .on('error', (err) => {
          console.error('Erro na conversão:', err);
          reject(err);
        })
        .save(tempWavPath);
    });
    
    const wavBuffer = fs.readFileSync(tempWavPath);
    
    // Configurar o serviço de reconhecimento de fala
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "pt-BR";
    
    // Importante: Ajustar o timeout para arquivos mais longos
    speechConfig.setProperty("ServiceConnectionTimeout", "600000"); // 10 minutos
    speechConfig.setProperty("InitialSilenceTimeout", "10000"); // 10 segundos
    speechConfig.setProperty("EndSilenceTimeout", "10000"); // 10 segundos
    
    // Criar um stream de entrada
    const pushStream = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1));
    pushStream.write(wavBuffer);
    pushStream.close();
    
    // Usar o stream como fonte de áudio
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    
    // Criar o reconhecedor de fala
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // Executar o reconhecimento contínuo
    const result = await new Promise<string>((resolve, reject) => {
      let fullTranscript = '';
      let hasError = false;
      
      // Evento para cada trecho de fala reconhecido
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          console.log(`Reconhecido: ${e.result.text}`);
          fullTranscript += e.result.text + ' ';
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          console.log('Sem correspondência de fala detectada');
        }
      };
      
      // Evento quando a sessão é iniciada
      recognizer.sessionStarted = (s, e) => {
        console.log('Sessão iniciada');
      };
      
      // Evento quando a sessão é finalizada
      recognizer.sessionStopped = (s, e) => {
        console.log('Sessão finalizada');
        if (!hasError) {
          recognizer.stopContinuousRecognitionAsync(
            () => {
              resolve(fullTranscript.trim());
              recognizer.close();
            },
            (err) => {
              reject(err);
              recognizer.close();
            }
          );
        }
      };
      
      // Evento de cancelamento (mais específico que o evento de erro)
      recognizer.canceled = (s, e) => {
        console.log(`Reconhecimento cancelado. Razão: ${e.reason}`);
        hasError = true;
        
        if (e.reason === sdk.CancellationReason.Error) {
          console.error(`Erro: ${e.errorDetails}`);
          if (e.errorDetails?.includes('Connection was closed')) {
            // Se foi erro de conexão, tenta retornar o que já foi transcrito
            recognizer.close();
            resolve(fullTranscript.trim());
          } else {
            recognizer.close();
            reject(new Error(e.errorDetails || 'Erro desconhecido'));
          }
        } else if (e.reason === sdk.CancellationReason.EndOfStream) {
          // Fim normal do stream
          recognizer.close();
          resolve(fullTranscript.trim());
        } else {
          recognizer.close();
          reject(new Error(`Reconhecimento cancelado: ${e.reason}`));
        }
      };
      
      // Evento de reconhecimento de fala (intermediário)
      recognizer.recognizing = (s, e) => {
        console.log(`Reconhecendo: ${e.result.text}`);
      };
      
      // Iniciar o reconhecimento contínuo
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Reconhecimento contínuo iniciado');
        },
        (err) => {
          console.error('Erro ao iniciar reconhecimento:', err);
          reject(err);
        }
      );
    });
    
    // Limpar arquivos temporários
    try {
      fs.unlinkSync(tempMp3Path);
      fs.unlinkSync(tempWavPath);
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos temporários:', cleanupError);
    }
    
    return result;
  } catch (error) {
    console.error("Erro na transcrição:", error);
    throw error;
  }
};

export const transcribeVideoFromUrl = async (videoUrl: string): Promise<string> => {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Gerar nomes únicos para os arquivos temporários
    const tempVideoPath = path.join(tempDir, `${uuidv4()}_video.mp4`);
    const tempAudioPath = path.join(tempDir, `${uuidv4()}_audio.wav`);

    // Baixar o vídeo da URL
    console.log('Baixando vídeo da URL...');
    
    // Primeiro, vamos verificar se a URL é válida
    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Verificar o content-type para confirmar que é um vídeo
    const contentType = response.headers['content-type'];
    console.log('Content-Type:', contentType);

    if (!contentType || (!contentType.includes('video') && !contentType.includes('octet-stream'))) {
      throw new Error(`Tipo de conteúdo inválido: ${contentType}`);
    }

    // Salvar o stream diretamente no arquivo
    const writer = fs.createWriteStream(tempVideoPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', (error) => reject(error));
    });

    // Verificar o tamanho do arquivo
    const stats = fs.statSync(tempVideoPath);
    console.log(`Vídeo baixado com ${stats.size} bytes`);

    // Verificar se o arquivo é um vídeo válido antes de tentar processar
    await new Promise<void>((resolve, reject) => {
      ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
        if (err) {
          console.error('Erro ao analisar o vídeo:', err);
          reject(new Error('Arquivo de vídeo inválido ou corrompido'));
        } else {
          console.log('Formato do vídeo:', metadata.format.format_name);
          console.log('Duração:', metadata.format.duration, 'segundos');
          resolve();
        }
      });
    });

    // Extrair áudio do vídeo e converter para WAV
    console.log('Extraindo áudio do vídeo...');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('start', (commandLine) => {
          console.log('Iniciando extração de áudio: ' + commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Progresso: ${progress.percent.toFixed(0)}%`);
          }
        })
        .on('end', () => {
          console.log('Extração de áudio concluída');
          resolve();
        })
        .on('error', (err) => {
          console.error('Erro na extração de áudio:', err);
          reject(err);
        })
        .save(tempAudioPath);
    });

    // Ler o arquivo WAV gerado
    const wavBuffer = fs.readFileSync(tempAudioPath);
    console.log(`Arquivo WAV gerado com ${wavBuffer.length} bytes`);

    // Configurar o serviço de reconhecimento de fala
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "pt-BR";
    
    // Criar um stream de entrada com o arquivo WAV
    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    );
    pushStream.write(wavBuffer);
    pushStream.close();
    
    // Usar o stream como fonte de áudio
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    
    // Criar o reconhecedor de fala
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // Executar o reconhecimento
    const result = await new Promise<string>((resolve, reject) => {
      let transcription = '';
      
      // Para vídeos mais longos, usar reconhecimento contínuo
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          transcription += e.result.text + ' ';
        }
      };
      
      recognizer.sessionStopped = (s, e) => {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            recognizer.close();
            resolve(transcription.trim());
          },
          (err) => {
            recognizer.close();
            reject(`Erro ao parar reconhecimento: ${err}`);
          }
        );
      };
      
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Iniciando reconhecimento de fala...');
        },
        (err) => {
          recognizer.close();
          reject(`Erro ao iniciar reconhecimento: ${err}`);
        }
      );
    });

    // Limpar arquivos temporários
    try {
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(tempAudioPath);
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos temporários:', cleanupError);
    }

    return result;
  } catch (error) {
    console.error("Erro na transcrição do vídeo:", error);
    throw error;
  }
};

export const transcribeVideoFromUrlVideo = async (videoUrl: string): Promise<string> => {
  const CONTAINER_NAME = "aic-aiscribes"; // Container para arquivos temporários
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  
  // Garantir que o container existe
  await containerClient.createIfNotExists();
  
  const videoBlobName = `${uuidv4()}_video.mp4`;
  const audioBlobName = `${uuidv4()}_audio.wav`;
  
  try {
    console.log('Baixando vídeo da URL...');
    
    // Baixar o vídeo da URL
    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*,application/*,*/*'
      }
    });
    
    console.log(`Vídeo baixado com ${response.data.byteLength} bytes`);
    
    // Upload do vídeo para o Blob Storage
    const videoBlobClient = containerClient.getBlockBlobClient(videoBlobName);
    await videoBlobClient.upload(response.data, response.data.byteLength);
    console.log('Vídeo carregado para o Blob Storage');
    
    // Gerar URL com SAS token para o vídeo
    const videoSasUrl = await generateBlobSasUrl(videoBlobClient);
    
    // Converter vídeo para áudio WAV usando streams em memória
    console.log('Extraindo áudio do vídeo...');
    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      
      outputStream.on('data', (chunk) => chunks.push(chunk));
      outputStream.on('end', () => resolve(Buffer.concat(chunks)));
      
      ffmpeg(videoSasUrl)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('error', (err) => reject(err))
        .pipe(outputStream, { end: true });
    });
    
    console.log(`Áudio extraído com ${audioBuffer.length} bytes`);
    
    // Upload do áudio WAV para o Blob Storage
    const audioBlobClient = containerClient.getBlockBlobClient(audioBlobName);
    await audioBlobClient.upload(audioBuffer, audioBuffer.length);
    
    // Configurar o serviço de reconhecimento de fala
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "pt-BR";
    
    // Criar um stream de entrada com o buffer de áudio
    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    );
    pushStream.write(audioBuffer);
    pushStream.close();
    
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // Executar reconhecimento contínuo
    const result = await new Promise<string>((resolve, reject) => {
      let transcription = '';
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          transcription += e.result.text + ' ';
        }
      };
      
      recognizer.sessionStopped = (s, e) => {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            recognizer.close();
            resolve(transcription.trim());
          },
          (err) => {
            recognizer.close();
            reject(`Erro ao parar reconhecimento: ${err}`);
          }
        );
      };
      
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Iniciando reconhecimento de fala...');
        },
        (err) => {
          recognizer.close();
          reject(`Erro ao iniciar reconhecimento: ${err}`);
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error("Erro na transcrição do vídeo:", error);
    throw error;
  } finally {
    // Limpar os blobs temporários
    try {
      await containerClient.getBlockBlobClient(videoBlobName).deleteIfExists();
      await containerClient.getBlockBlobClient(audioBlobName).deleteIfExists();
      console.log('Arquivos temporários removidos do Blob Storage');
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos no Blob Storage:', cleanupError);
    }
  }
};

async function generateBlobSasUrl(blobClient: any): Promise<string> {
  const BlobSASPermissions = require('@azure/storage-blob').BlobSASPermissions;
  const generateBlobSASQueryParameters = require('@azure/storage-blob').generateBlobSASQueryParameters;
  const StorageSharedKeyCredential = require('@azure/storage-blob').StorageSharedKeyCredential;
  
  const sasOptions = {
    containerName: blobClient.containerName,
    blobName: blobClient.name,
    permissions: BlobSASPermissions.parse("r"), // Somente leitura
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hora
  };
  
  // Extrair credenciais da connection string
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1];
  const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1];
  
  if (!accountName || !accountKey) {
    throw new Error('Não foi possível extrair credenciais da connection string');
  }
  
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  
  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  
  return `${blobClient.url}?${sasToken}`;
}

interface Word {
  text: string;
  start_timestamp: number;
  end_timestamp: number;
  language: string | null;
  confidence: number;
}

interface TranscriptionSegment {
  words: Word[];
  speaker: string | null;
  speaker_id: string | null;
  language: string | null;
}

export const getTranscriptFromRecall = async (botId: string): Promise<string> => {
  try {
    // Fazer a chamada para o endpoint Recall
    const response = await axios.get<TranscriptionSegment[]>(
      `https://us-west-2.recall.ai/api/v1/bot/${botId}/transcript/`,
      {
        headers: {
          'Authorization': `${process.env.RECALL_API_KEY}`, // Se precisar de autenticação
          'Content-Type': 'application/json'
        }
      }
    );

    // Processar todos os segmentos de transcrição
    const segments = response.data;
    
    // Concatenar todos os textos
    const fullTranscript = segments
      .flatMap(segment => segment.words)
      .map(word => word.text)
      .join(' ')
      .replace(/\s+([.,!?])/g, '$1') // Remove espaços antes de pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
      .trim();

    return fullTranscript;
  } catch (error) {
    console.error('Erro ao buscar transcrição do Recall:', error);
    throw error;
  }
};