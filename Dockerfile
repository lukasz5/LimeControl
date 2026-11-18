# syntax=docker/dockerfile:1

# ---- Build: frontend (Vite) + bundled Express server ----
FROM oven/bun:1.4 AS build
WORKDIR /src

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Two flavours of the same image:
#   - cloud service (default): Google sign-in + Firestore. The Firebase web config is not
#     committed; CI writes firebase-applet-config.json before the build.
#   - self-hosted: build with --build-arg VITE_AUTH_MODE=local. No Firebase config is needed
#     or embedded; users sign in with an access key (see deploy/selfhost/).
ARG VITE_AUTH_MODE=""
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
RUN if [ "$VITE_AUTH_MODE" = "local" ]; then \
      echo '{}' > firebase-applet-config.json; \
    elif [ ! -f firebase-applet-config.json ]; then \
      echo "firebase-applet-config.json is missing (or build with --build-arg VITE_AUTH_MODE=local)" >&2; exit 1; \
    fi

ARG VITE_SUPPORT_URL=""
ARG VITE_APP_STORE_URL=""
ARG VITE_PLAY_STORE_URL=""
ENV VITE_SUPPORT_URL=$VITE_SUPPORT_URL \
    VITE_APP_STORE_URL=$VITE_APP_STORE_URL \
    VITE_PLAY_STORE_URL=$VITE_PLAY_STORE_URL

RUN bun run build \
 && bunx esbuild server.ts \
      --bundle --platform=node --format=esm --target=node22 \
      --external:vite \
      --banner:js="import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" \
      --outfile=server.mjs

# ---- Runtime: plain Node, no node_modules needed ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY --from=build --chown=node:node /src/server.mjs ./server.mjs
COPY --from=build --chown=node:node /src/dist ./dist
COPY --from=build --chown=node:node /src/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=build --chown=node:node /src/package.json ./package.json
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 8080
VOLUME ["/app/data"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=4 \
  CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1

CMD ["node", "server.mjs"]
