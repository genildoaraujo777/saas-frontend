# ========================
# Stage 1: Build (Compilação)
# ========================
FROM node:20 as builder

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de definição de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código-fonte
COPY . .
RUN npm run build

# ========================
# Stage 2: Serve (Produção com Nginx)
# ========================
FROM nginx:alpine as final

# 1. REMOVE a configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# 2. COPIA a configuração SIMPLES que serve apenas arquivos estáticos
COPY ./frontend.nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copia os arquivos estáticos (Caminho 'root' deve corresponder ao nginx.conf simples)
COPY --from=builder /app/dist /usr/share/nginx/html/fbmstore/ 

# 4. EXPOSE
EXPOSE 80
# O comando para iniciar o Nginx já é o CMD padrão da imagem nginx:alpine.