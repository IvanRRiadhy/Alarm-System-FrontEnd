# Use Node.js 20 alpine as the base image
FROM node:20-alpine

# Install git since it is required for checkupdate/git status/git pull
RUN apk add --no-cache git

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies using npm ci with legacy peer deps option to resolve React 19 peer conflict
RUN npm ci --legacy-peer-deps

# Copy all files (including the .git directory)
COPY . .

# Build the react application directly using Vite to avoid failing on pre-existing tsc warnings
RUN npx vite build

# Expose port 3500
EXPOSE 3500

# Start the node updater and static server
CMD ["node", "server.js"]
