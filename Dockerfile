FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg curl && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p data downloads

CMD ["node", "index.js"]
