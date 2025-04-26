# Estágio de build
FROM node:20-alpine AS builder

# Instalar dependências necessárias para o sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Criar e definir o diretório de trabalho
WORKDIR /usr/src/app

# Copiar apenas os arquivos de dependências primeiro
COPY package*.json ./

# Remover sharp das dependências para instalá-lo separadamente
RUN npm ci && \
    npm uninstall sharp && \
    npm install --platform=linux --libc=musl sharp

# Copiar o restante do código-fonte da aplicação
COPY . .

# Copiar o arquivo .env (se existir)
COPY .env* ./

# Criar diretório temp necessário para o fileUpload
RUN mkdir -p temp

# Compilar o TypeScript
RUN npm run build

# Estágio de produção
FROM node:20-alpine AS production

# Instalar dependências necessárias para o sharp em produção
RUN apk add --no-cache vips-dev

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Criar e definir o diretório de trabalho
WORKDIR /usr/src/app

# Copiar apenas os arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção com suporte específico para Alpine Linux
RUN npm ci --only=production --ignore-scripts && \
    npm uninstall sharp && \
    npm install --platform=linux --libc=musl --only=production sharp

# Copiar os arquivos compilados do estágio de build
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/temp ./temp

# Copiar o arquivo .env do estágio de builder
COPY --from=builder /usr/src/app/.env* ./

# Expor a porta da aplicação
EXPOSE 3000

# Configurar healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Iniciar a aplicação
CMD ["node", "dist/server.js"]

# Teste para iniciar pipeline na branch main