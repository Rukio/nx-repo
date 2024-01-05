#!/usr/bin/env bash
set -euo pipefail

: '
buf requires the protoc binary to generate python client stubs (and a few other irrelevant languages).
Luckily, we can download protoc from github. This script determines the local arch + os and downloads
the proper version of file from github
NOTE: Only works for osx + aarch64 (M1s) for now. Add more as needed

INPUT:
- version of proto binary to pull from github. FORMAT: "v3.20.1"
- install bin directory location

DEPENDENCY:
- INSTALL_BIN_DIR: absolute path to install bin. Defined in the Makefile, if called
    outside the Makefile, you must pass it as a temp env var ie:
    INSTALL_BIN_DIR=/Users/manu.sabherwal/Documents/code/services/bin ./download-protoc.sh v3.20.1

-checks if protoc binary already exists. IF exists, skip generating
-queries the operating system for architecture
-pulls the associated binary package from github into temp dir
-unzips + moves the binary to the bin folder
-deletes temp dir
'
## Helper funcs

# get_os creates and populates the os variable.
# needed as a translation layer, as '$uname -s's output validates os but doesn't align with needed value
get_os()
{
    os="$(uname -s)"
    case ${os} in
        "Darwin")
            os="osx"
        ;;
        "Linux")
            os="linux"
        ;;
        *)
            echo "Operating system unrecognized! Please update ./scripts/download-protoc.sh to recognize: ${os}" 1>&2
            exit 1
        ;;
    esac
}

# get_architecture creates and populates the arch variable.
# needed as a translation layer, as '$uname -m's output validates arch but doesn't align with needed value
get_architecture()
{
    arch="$(uname -m)"
    case ${arch} in
        "arm64" | "aarch64")
            arch="aarch_64"
        ;;
        "x86_64")
            arch="x86_64"
        ;;
        *)
            echo "Processor architecture unrecognized! Please update ./scripts/download-protoc.sh to recognize: ${arch}" 1>&2
            exit 1
        ;;
    esac
}

### MAIN FUNC

## validate input
# verify only 2 inputs are passed in
# 1) PY_PROTOBUF_VERSION
# 2) INSTALL_BIN_DIR

if [ $# -ne 2 ]
    then
        echo "download-protoc.sh takes exactly 2 input! $# provided" 1>&2
        exit 1
fi

binvers=$1
bindir=$2

if [ -f "${bindir}/protoc" ]
    then
        if [ "$("${bindir}"/protoc --version)" == "libprotoc ${binvers:1}" ]
            then
                echo "protoc already exists with the proper version" 1>&2
                exit 0
        fi
        echo "protoc already exists, but is the wrong version. Continuing to replace binary" 1>&2
fi


# verify the version actually exists
# run a head request for the release webpage and verify it returns 200
httpstatus=$(curl -s -o /dev/null -I -w "%{http_code}" "https://github.com/protocolbuffers/protobuf/releases/tag/${binvers}")
if [[ $httpstatus != "200" ]]
    then
        echo "Could not find provided release version for proto binary release! version provided: ${binvers}" 1>&2
        exit 1
fi


tempdir=$(mktemp -d)
cd "${tempdir}"

get_os
get_architecture

FILENAME="protoc-${binvers:1}-${os}-${arch}.zip"
DL_LINK="https://github.com/protocolbuffers/protobuf/releases/download/${binvers}/${FILENAME}"
curl -O -L "${DL_LINK}"
unzip "${FILENAME}"
mv "./bin/protoc" "${bindir}"
rm -rf "${tempdir}"
