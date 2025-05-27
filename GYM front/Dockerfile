# Use uma imagem oficial do Node.js como base
FROM node:18

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie o package.json e o package-lock.json para instalar as dependências
COPY package*.json ./

# Instale as dependências do front-end
RUN npm install

# Copie o restante dos arquivos do front-end para o diretório de trabalho
COPY . .

# Exponha a porta na qual o front-end irá rodar
EXPOSE 4200

# Comando para iniciar o Angular
CMD ["npm", "start"]
