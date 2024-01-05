FROM ghcr.io/runatlantis/atlantis:v0.22.2-debian

# Simplification of https://github.com/terraform-linters/tflint/blob/master/install_linux.sh
RUN curl --location --output /tmp/tflint.zip https://github.com/terraform-linters/tflint/releases/download/v0.45.0/tflint_linux_amd64.zip  \
  && unzip -u /tmp/tflint.zip -d /tmp/ \
  && install -c -v /tmp/tflint /usr/local/bin \
  && rm -f /tmp/tflint.zip /tmp/tflint

RUN apt update \
  && curl --location --output /tmp/aptible.deb https://omnibus-aptible-toolbelt.s3.amazonaws.com/aptible/omnibus-aptible-toolbelt/master/384/pkg/aptible-toolbelt_0.19.6%2B20220928203530~debian.9.13-1_amd64.deb \
  && apt-get install -y /tmp/aptible.deb \
  && apt-get install -y jq

RUN  curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
  chmod +x ./kubectl && \
  mv ./kubectl /usr/local/bin/kubectl
