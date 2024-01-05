FROM node:18.16.1-bullseye AS build
COPY --from=golang:1.21.0-bullseye /usr/local/go/ /usr/local/go/

ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /app
ARG BUILD_TARGET

COPY Makefile go.mod go.sum package.json package-lock.json tsconfig.base.json nx.json buf.gen.go.yaml buf.gen.ts.yaml buf.work.yaml /app/

# Defaults for prod
ARG GITHUB_TOKEN

# Configure the app env
ENV NODE_ENV='production'
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

RUN npm ci --production=false --silent

COPY ts/ /app/ts/

COPY proto/ /app/proto

COPY scripts/onboarding/ /app/scripts/onboarding

RUN make build-ts-onboarding-api

RUN npm ci --only=production && npm cache clean --force


FROM node:18.16.1-bullseye-slim AS production
ENV NODE_ENV='production'
WORKDIR /app
ARG BUILD_TARGET
USER node

ARG DOCKER_PORT
EXPOSE $DOCKER_PORT

COPY /docker/Procfile /.aptible/Procfile
COPY --chown=node:node --from=build /app/node_modules /app/node_modules/
COPY /docker/$BUILD_TARGET-entrypoint.sh /entrypoint.sh
COPY --chown=node:node --from=build /app/dist/ts/apps/nest/onboarding-api /app/dist/
