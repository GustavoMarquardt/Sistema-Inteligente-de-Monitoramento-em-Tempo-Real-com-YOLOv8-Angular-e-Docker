# Base image
FROM node:16

# Define o diretório de trabalho
WORKDIR /app

# Copia o arquivo package.json e package-lock.json e instala as dependências
COPY package.json . 
COPY package-lock.json . 

# Instalando o ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*  # Limpeza de cache para reduzir o tamanho da imagem

# Instalando as dependências do Node.js
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Expõe a porta que o app vai rodar
EXPOSE 3000

# Comando para rodar a aplicação (ajuste conforme seu ponto de entrada)
CMD ["node", "index.js"]
