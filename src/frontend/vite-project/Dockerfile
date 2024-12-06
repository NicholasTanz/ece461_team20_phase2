# Use Node.js base image
FROM node:18 AS base
WORKDIR /usr/src/app

# Install Bun alongside Node.js
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy files and install dependencies with Bun
COPY package.json bun.lockb ./
RUN bun install

# Expose port for Vite
EXPOSE 5173

# Use Node.js to run Vite (dev server)
ENTRYPOINT ["bun", "run", "dev", "--", "--host"]
