import twilio from 'twilio';
import { twilioConfig, nameGenerator } from '../config/twilioConfig';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = twilio.twiml.VoiceResponse;

export function generateToken(identity?: string) {
    // Gerar um nome aleatório se não for fornecido
    const clientIdentity = identity || nameGenerator();
    
    // Criar um token de acesso com as credenciais do projeto
    const accessToken = new AccessToken(
      twilioConfig.accountSid,
      twilioConfig.apiKey,
      twilioConfig.apiSecret,
      { identity: clientIdentity }
    );
    
    // Criar uma concessão de voz para o token
    const grant = new VoiceGrant({
      outgoingApplicationSid: twilioConfig.twimlAppSid,
      incomingAllow: true,
    });
    
    // Adicionar a concessão ao token
    accessToken.addGrant(grant);
    
    // Retornar o token e a identidade
    return {
      identity: clientIdentity,
      token: accessToken.toJwt(),
    };
};

export function createVoiceResponse(requestBody: any) {
    const twiml = new VoiceResponse();
    const toNumberOrClientName = requestBody.To;
    const callerId = twilioConfig.callerId;
    const clientIdentity = requestBody.From || requestBody.identity || 'default-client';
    
    // Se a requisição é para o número da Twilio, é uma chamada de entrada
    if (toNumberOrClientName === callerId) {
      const dial = twiml.dial();
      dial.client(clientIdentity);
    } 
    // Se há um número de destino, é uma chamada de saída
    else if (toNumberOrClientName) {
      const dial = twiml.dial({ callerId });
      
      // Verificar se o destino é um número de telefone ou um nome de cliente
      if (isValidPhoneNumber(toNumberOrClientName)) {
        dial.number({}, toNumberOrClientName);
      } else {
        dial.client({}, toNumberOrClientName);
      }
    } 
    // Caso contrário, apenas reproduz uma mensagem
    else {
      twiml.say('Obrigado por ligar!');
    }
    
    return twiml.toString();
  }

  function isValidPhoneNumber(number: string) {
    return /^[\d\+\-\(\) ]+$/.test(number);
  }