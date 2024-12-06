# Use the official Bun image for the frontend
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory (frontend)
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies) (frontend)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory, then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .  

# [optional] build the frontend
ENV NODE_ENV=production

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules

# Run the frontend app (development mode)
USER bun
EXPOSE 5173

# For running Vite in development mode with --host
ENTRYPOINT ["bun", "run", "dev", "--", "--host"] 
