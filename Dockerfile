FROM mcr.microsoft.com/azure-functions/node:4-node20

# Definir diretório de trabalho
WORKDIR /home/site/wwwroot

# Instalar Azure Functions Core Tools explicitamente
RUN apt-get update && \
    apt-get install -y wget ca-certificates gnupg && \
    wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | apt-key add - && \
    wget -q https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y azure-functions-core-tools-4

# Copiar apenas os arquivos essenciais para instalar dependências
COPY package.json package-lock.json tsconfig.json ./

# Instalar dependências de forma otimizada
RUN npm install --legacy-peer-deps

# Instalar TypeScript globalmente no container
RUN npm install -g typescript

# Copiar o restante do código do aplicativo
COPY . .

# Construir o aplicativo
RUN npm run build --legacy-peer-deps

# Expor a porta na qual o aplicativo será executado
EXPOSE 7071

# Comando para iniciar o aplicativo
CMD ["npm", "start"]
