import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';

import pacienteRoute from './routes/pacienteRoute';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'API AIC em funcionamento.',
        version: '1.0.0',
    });
});

app.use('/api/database', pacienteRoute);

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