FROM node:18-bullseye

# Install ffmpeg & curl
RUN apt-get update && apt-get install -y ffmpeg curl

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
