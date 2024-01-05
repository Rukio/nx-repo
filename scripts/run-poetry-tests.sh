#!/usr/bin/env bash
set -euo pipefail

: '
This script runs "poetry run pytest" in the specified directory

INPUT:
- path of directory where pytest are located
'

xmldir="${PWD}/generated/test"

if [ $# -ne 1 ]
    then
        echo "Expecting 1 inputs but got $#"
        exit
fi

dir=$1
package=`basename $dir`

# Because find command will return top level directory, skip running poetry if no /test dir is found
if [ ! -d "$dir/tests" ]; then
    exit 0
fi

cd "$dir"
poetry install
COVERAGE_FILE=.coverage.$package poetry run pytest --cov=./ --cov-report=xml --cov-branch
