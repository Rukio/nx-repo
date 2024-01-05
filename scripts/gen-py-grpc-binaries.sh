#!/usr/bin/env bash
set -euo pipefail
: '
buf (or proto/grpc language stub generator) requires a python plugin binary to generate grpc stubs,
but the grpc maintainers recommends using the python lib grpcio + grpctools instead (which seemingly does not use a binary).
There are no examples of getting grpcio to work with buf, but there are examples of
generating the python plugin.
There is no easily available precompiled binary for the python plugin, so this script compiles
grpc locally and moves the generated python binary into service/bin

-checks if grpc_python_plugin already exists.
    -IF exists:
        - AND IF grpc_python_plugin.version file exists, verify grpc_python_plugin is at proper version. ELSE dl
        - IF grpc_python_plugin.version DOES NOT exist, recreate grpc_python_plugin and set version file
    -ELSE
        - DL + set version

-pulls the grpc repo at provided version tag into a temporary directory
-compiles the grpc plugins using cmake https://bufbuild.slack.com/archives/CRZ680FUH/p1662652502108209?thread_ts=1662649022.517889&cid=CRZ680FUH
-moves the grpc python plugin into bin dir
-set grpc_python_plugin.version to version tag

DEPENDENCIES:
- INSTALL_BIN_DIR: required as env var. Points to services/bin

INPUT:
- tag of proto binary to pull from github. FORMAT: "v1.45.0"
- install bin directory location

TODO: Investigate the possibility of using https://github.com/grpc/grpc/issues/15675#issuecomment-867894595
instead of regenerating all targets, hopefully the pip command pulls a precompile binary
and will be much faster
'

if [ $# -ne 2 ]
    then
        echo "gen-grpcpbinaries.sh takes exactly 2 input! $# provided" 1>&2
        exit 1
fi
grpcvers=$1
bindir=$2

if [ -f "${bindir}/grpc_python_plugin" ]
    then
        if [ ! -f "${bindir}/grpc_python_plugin.version" ]
            then
                echo "grpc_python_plugin exists without version file, will redownload to guarantee compliance" 1>&2
        else
            if [ "$(cat "${bindir}/grpc_python_plugin.version")" == "${grpcvers}" ]
                then
                    echo "grpc_python_plugin already exists with the proper version" 1>&2
                    exit 0
            fi
            echo "grpc_python_plugin already exists, but is the wrong version. Continuing to replace binary" 1>&2
        fi
fi


tempdir=$(mktemp -d)
cd "${tempdir}"

# follows instructions from https://github.com/grpc/grpc/blob/master/BUILDING.md#linuxunix-using-make
git clone --depth=1 -b "${grpcvers}" --recurse-submodules https://github.com/grpc/grpc
cd grpc
cmake . && cmake --build . --target plugins
mv ./grpc_python_plugin "${bindir}"

rm -rf "${tempdir}"
echo "${grpcvers}" >| "${bindir}"/grpc_python_plugin.version