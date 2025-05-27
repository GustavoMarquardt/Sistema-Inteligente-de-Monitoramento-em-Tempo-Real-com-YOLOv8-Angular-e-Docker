FROM python:3.11-slim

# Instala as dependências do sistema para o OpenCV e ffmpeg
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libx11-dev \
    libatk1.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos necessários
COPY requirements.txt .

# Atualiza o pip e instala as dependências
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copia o código do projeto
COPY . .

# Comando padrão ao iniciar o container
CMD ["sh", "-c", "ls -l /app/codigos && python ./codigos/modelo_on_cams.py"]

