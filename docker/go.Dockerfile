ARG BUILD_TARGET
FROM golang:1.21.1-bullseye as build
ARG BUILD_TARGET

WORKDIR /go/src/app
COPY Makefile go.mod go.sum buf.gen.go.yaml buf.work.yaml /go/src/app/
RUN make setup-docker-go

COPY go/ /go/src/app/go/
COPY proto/ /go/src/app/proto/
COPY sql/ /go/src/app/sql/

ARG VERSION='dev'
RUN VERSION=${VERSION} make build-go-$BUILD_TARGET

FROM gcr.io/distroless/base-debian11:debug-nonroot
ARG BUILD_TARGET

ARG DOCKER_PORT
EXPOSE $DOCKER_PORT

COPY /docker/Procfile /.aptible/Procfile
COPY /docker/default-entrypoint.sh /entrypoint.sh
COPY /docker/$BUILD_TARGET-entrypoint.sh* /entrypoint.sh

COPY --from=build /go/src/app/generated/bin/go/cmd/$BUILD_TARGET/$BUILD_TARGET /app
