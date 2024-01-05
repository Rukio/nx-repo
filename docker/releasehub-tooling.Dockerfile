FROM golang:1.21.1-bullseye

WORKDIR /go/src/app
COPY Makefile /go/src/app
COPY sql /go/src/app/sql

RUN make setup-docker-go

ARG DATABASE_NAME
ENV DB=$DATABASE_NAME
CMD make db-migrate-$DB
