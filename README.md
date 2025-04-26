# API-Express - AIC

API Node.js com Express para o projeto AIC (Vital HC UFPE), fornecendo endpoints para gerenciamento de pacientes, processamento de imagens, armazenamento de arquivos e integração com serviços externos.

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Endpoints](#endpoints)
- [Docker](#docker)
- [Testes](#testes)
- [Contribuição](#contribuição)

## Visão Geral

Esta API foi desenvolvida para o projeto AIC (Vital HC UFPE), oferecendo uma interface para gerenciamento de pacientes, processamento de imagens médicas, armazenamento de arquivos e integração com serviços externos. Originalmente migrada de Azure Functions para Express, a API mantém compatibilidade com Azure Blob Storage para armazenamento de arquivos e utiliza a biblioteca Sharp para processamento de imagens.

## Tecnologias

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web para Node.js
- **TypeScript** - Superset tipado de JavaScript
- **Azure Blob Storage** - Serviço de armazenamento de objetos
- **Sharp** - Biblioteca de processamento de imagens
- **PostgreSQL** - Banco de dados relacional (via pg)
- **Supabase** - Plataforma de backend como serviço
- **Docker** - Plataforma de containerização

## Estrutura do Projeto

```
api-js/
├── src/
│   ├── config/          # Configurações da aplicação
│   ├── controllers/     # Controladores para as rotas
│   ├── cron/            # Tarefas agendadas
│   ├── routes/          # Definição das rotas da API
│   ├── services/        # Serviços de negócio
│   ├── types/           # Definições de tipos TypeScript
│   └── server.ts        # Ponto de entrada da aplicação
├── tests/               # Testes automatizados
├── __blobstorage__/     # Armazenamento local para desenvolvimento
├── temp/                # Diretório temporário para uploads
├── .env                 # Variáveis de ambiente
├── Dockerfile           # Configuração para containerização
├── package.json         # Dependências e scripts
└── tsconfig.json        # Configuração do TypeScript
```

## Requisitos

- Node.js 20.x ou superior
- npm 9.x ou superior
- Docker (opcional, para containerização)
- Conta Azure Storage (opcional, para armazenamento em nuvem)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd api-js
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o projeto:
   ```bash
   npm run build
   ```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Azure Storage (opcional)
AZURE_STORAGE_ACCOUNT_NAME=seu_account_name
AZURE_STORAGE_ACCOUNT_KEY=sua_account_key
AZURE_STORAGE_CONNECTION_STRING=sua_connection_string
AZURE_STORAGE_COUNTAINER_NAME_PDF=vital-pdfs

# Supabase (se aplicável)
SUPABASE_URL=sua_supabase_url
SUPABASE_KEY=sua_supabase_key

# Outras configurações
NODE_ENV=development
PORT=3000
```

2. Crie os diretórios necessários:
   ```bash
   mkdir -p temp
   ```

## Uso

### Desenvolvimento

Para executar a aplicação em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

### Produção

Para executar a aplicação em modo de produção:

```bash
npm run build
npm start
```

## Endpoints

A API oferece os seguintes endpoints principais:

- **Raiz**: `GET /` - Verifica se a API está em funcionamento
- **Saúde**: `GET /health` - Endpoint de healthcheck
- **Pacientes**: `/api/database` - Gerenciamento de pacientes
- **Requisições**: `/api/database` - Gerenciamento de requisições
- **Autenticação**: `/api/auth` - Autenticação de usuários
- **Armazenamento**: `/api/storage` - Upload e gerenciamento de arquivos
- **Estatísticas**: `/api/statistics` - Obtenção de estatísticas
- **Integração Externa**: `/api/external` - Integração com serviços externos
- **Vital CV**: `/api` - Endpoints relacionados ao Vital CV

## Docker

A aplicação pode ser executada em um container Docker:

### Construir a imagem

```bash
docker build -t api-express .
```

### Executar o container

```bash
docker run -p 3000:3000 --env-file .env api-express
```

### Notas sobre o Docker

O Dockerfile é otimizado para suportar a biblioteca Sharp no Alpine Linux, com um processo de build em dois estágios para reduzir o tamanho da imagem final.

## Testes

Para executar os testes:

```bash
npm test
```

Para executar os testes com cobertura:

```bash
npm run coverage
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

Desenvolvido para o projeto AIC - Vital HC UFPE