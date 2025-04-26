import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import { initVitalCheckScheduler, executeVitalCheckOnStartup } from './cron/vitalCheckWaveCron';

import pacienteRoute from './routes/pacienteRoute';
import requestRoute from './routes/requestRoute';
import externalRoute from './routes/externalRoute';
import authRoute from './routes/authRoute';
import aiscribeRoute from './routes/aiscribeRoute';
import statisticsRoute from './routes/statisticsRoute';
import evaluationRoute from './routes/evaluationRoute';
import wudRoute from './routes/wudRoute';
import storageRoute from './routes/storageRoute';
import uploadRoute from './routes/uploadRoute';
import vitalCvRoute from './routes/vitalCvRoute';
import databaseRoute from './routes/databaseRoute';
import twilioRoute from './routes/twilioRoute';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors({
    origin: '*',  // Ou especifique as origens permitidas
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(bodyParser.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

initVitalCheckScheduler();
executeVitalCheckOnStartup();

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'API-AIC em funcionamento.',
        version: '1.0.0',
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.post('/test-post', (req, res) => {
    console.log('Received POST body:', req.body);
    res.json({ success: true, receivedBody: req.body });
  });

app.use('/api/database', pacienteRoute);
app.use('/api/database', requestRoute);
app.use('/api/external', externalRoute);
app.use('/api/auth', authRoute);
app.use('/api/aiscribe', aiscribeRoute);
app.use('/api/statistics', statisticsRoute);
app.use('/api/database', evaluationRoute);
app.use('/api/wud', wudRoute);
app.use('/api/storage', storageRoute);
app.use('/api/storage', uploadRoute);
app.use('/api', vitalCvRoute);
app.use('/api/database', databaseRoute);
app.use('/api/twilio', twilioRoute);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro na aplicação:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro ao processar sua solicitação'
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando o servidor...');
    server.close(() => {
      console.log('Servidor encerrado');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT recebido. Encerrando o servidor...');
    server.close(() => {
      console.log('Servidor encerrado');
      process.exit(0);
    });
  });

  export default app;