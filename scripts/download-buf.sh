#!/usr/bin/env bash
set -euo pipefail

# This script downloads buf to to /bin in the specified directory

if [ $# -ne 2 ]
    then
        echo "Expecting 2 inputs but got $#"
        exit
fi

bin=$1
version=$2
os=$(uname -s)
arch=$(uname -m)

curl -sSL "https://github.com/bufbuild/buf/releases/download/${version}/buf-${os}-${arch}" -o "${bin}/buf"
chmod +x "${bin}/buf"
