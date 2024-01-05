## Stage for building grpc binary
ARG PYTHON_VERS
FROM python:$PYTHON_VERS-slim-bullseye AS base

WORKDIR /app

RUN mkdir -p /app/bin && \
  mkdir -p /app/scripts && \
  apt-get update && \
  apt-get install --no-install-recommends -y \
    build-essential \
    autoconf \
    libtool \
    pkg-config \
    cmake \
    git-all

COPY scripts/gen-py-grpc-binaries.sh /app/scripts/
ARG GRPC_REPO_VERSION
RUN /app/scripts/gen-py-grpc-binaries.sh $GRPC_REPO_VERSION /app/bin

FROM golang:1.21.1-bullseye AS sqlbuild

WORKDIR /app

RUN apt-get update && apt-get install curl unzip make -y
COPY Makefile /app/
RUN mkdir -p /app/bin
RUN make setup-linux-python-gen


FROM python:$PYTHON_VERS-slim-bullseye AS deploy

RUN apt-get update && apt-get install curl unzip make -y

WORKDIR /app

RUN mkdir -p /app/bin && mkdir -p /app/scripts
COPY scripts/download-protoc.sh /app/scripts/

ARG PY_PROTOBUF_VERSION
ARG BUF_VERSION
# TODO: Remove poetry version hardcoding after moving to Github Actions
RUN /app/scripts/download-protoc.sh $PY_PROTOBUF_VERSION /app/bin && \
  curl -sSL "https://github.com/bufbuild/buf/releases/download/${BUF_VERSION}/buf-Linux-x86_64" \
  -o "/app/bin/buf" && \
  chmod +x "/app/bin/buf" && \
  curl -sSL https://install.python-poetry.org | python3 - --version 1.5.1

ENV PATH="${PATH}:/root/.local/bin"

COPY --from=base /app/bin/grpc_python_plugin /app/bin/grpc_python_plugin
COPY --from=base /app/bin/grpc_python_plugin.version /app/bin/grpc_python_plugin.version
COPY --from=sqlbuild /app/bin/sqlc /app/bin/sqlc
COPY buf.gen.python.yaml buf.work.yaml Makefile poetry.lock pyproject.toml /app/
COPY proto /app/proto
COPY py /app/py
COPY scripts /app/scripts
COPY sql /app/sql

RUN poetry install
RUN make gen-proto-python
RUN make gen-sql

WORKDIR /app/py/tools/grpc_proxy
RUN poetry install

ARG BUILD_TARGET
RUN cd $(echo "/app/py/projects/${BUILD_TARGET}" | sed 's/-/_/g') && poetry install

# Expose server ports
ARG DOCKER_PORT
EXPOSE $DOCKER_PORT

# RUN server
WORKDIR /app

ENV BUILD_TARGET ${BUILD_TARGET}

# make build-time git_sha available in env
ARG GIT_SHA
ENV GIT_SHA ${GIT_SHA}

CMD ["make", "run-python-server-${BUILD_TARGET}"]
