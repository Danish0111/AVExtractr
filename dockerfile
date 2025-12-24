FROM node:20-bookworm

# Install Python + yt-dlp + ffmpeg
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg curl && \
    pip install yt-dlp --break-system-packages

WORKDIR /app
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]