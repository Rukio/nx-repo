FROM gradle:8.1.1-jdk17
ARG BUILD_TARGET
ARG DOCKER_PORT

EXPOSE $DOCKER_PORT

WORKDIR /java/app
COPY proto /proto
COPY java/$BUILD_TARGET /java/app

# TODO(MARK-2736): Fix test failures during build in ReleaseHub
RUN gradle build -x test

ENTRYPOINT gradle run
