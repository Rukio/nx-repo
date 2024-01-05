FROM node:18.16.1-bullseye AS build
ENV NODE_ENV='production'
WORKDIR /app
ARG BUILD_TARGET

COPY Makefile package.json package-lock.json tsconfig.base.json nx.json /app/

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

RUN npm ci --production=false

COPY ts/ /app/ts/

RUN make build-ts-companion-api

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate --schema "/app/dist/ts/apps/nest/companion-api/prisma/schema.prisma"


FROM node:18.16.1-bullseye-slim as production
ENV NODE_ENV='production'
WORKDIR /app
ARG BUILD_TARGET
USER node

ARG GIT_SHA='unknown'
ENV GIT_SHA ${GIT_SHA}

ARG DOCKER_PORT
EXPOSE $DOCKER_PORT

COPY /docker/Procfile /.aptible/Procfile
COPY --chown=node:node --from=build /app/node_modules /app/node_modules/
COPY /docker/$BUILD_TARGET-entrypoint.sh /entrypoint.sh
COPY --chown=node:node --from=build /app/dist/ts/apps/nest/companion-api /app/dist/
