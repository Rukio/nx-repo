#!/usr/bin/env bash
# Script expect a string to be passed representing
# the wanted python version, and runs poetry locally to determine
# the local python version. If they don't match, remove and
# reinstall python (remove is needed as patch versions aren't
# respected)
# NOTE: Seemingly (have not been able to do thorough tests), but
#       the needed python version should already be the asdf python version,
#       ie and updated .tool-versions + running `asdf install python` should have
#       occured.there is an assumption that the poetry toml file already
#       lists the proper patch version of python, as you ask poetry to install
#       only major+minor, but assumedly the toml will force the patch version
set -euo pipefail

wanted=$1
existing=$(poetry env info | awk '/Python:/ {print $2}' | head -n 1)


if [ ! "${wanted}" = "${existing}" ]
  then
    python_vers="python$( echo "$wanted" | awk -F'.' '{print$1"."$2}')"
    poetry env remove $python_vers || true
    poetry env use $python_vers
fi

