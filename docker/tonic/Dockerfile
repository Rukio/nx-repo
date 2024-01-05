# Dockerfile for tonic.ai data load automation.
# Using postgres image since it has pg_dump installed.
FROM postgres:14.7

ENV POSTGRES_HOST_AUTH_METHOD=trust

# Install Aptible CLI, AWS CLI
RUN apt update && apt install curl -y \
  && curl --location --output /tmp/aptible.deb https://omnibus-aptible-toolbelt.s3.amazonaws.com/aptible/omnibus-aptible-toolbelt/master/384/pkg/aptible-toolbelt_0.19.6%2B20220928203530~debian.9.13-1_amd64.deb \
  && apt install /tmp/aptible.deb -y \
  && apt install awscli -y

# Create app mkdir
WORKDIR /app

COPY docker/tonic/tonic*.sh /app/
