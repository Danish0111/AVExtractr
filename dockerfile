FROM node:20-bookworm

# Install system deps (bookworm has Python 3.11+)
RUN apt-get update && apt-get install -y ffmpeg curl

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy entire project
COPY . .

# Install dependencies + build frontend
RUN npm run build

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]