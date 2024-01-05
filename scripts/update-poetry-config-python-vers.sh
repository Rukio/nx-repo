#!/usr/bin/env bash
# WARNING: written with the assumption that you run it from
#          the root of services repo
# Given the new python version needed,  will find the
# upper bound of the given version (will isolate to this major.minor version, but
# allow newer patch versions), iterate through the /py folder and find all pyproject.toml files,
# then update the pyproject.tomls in place
# NOTE: assumes you run from services home dir
set -euo pipefail
# scripts dir
DIR="$(cd "$(dirname "$0")" && pwd)"

lower_bound="$(awk '/python/ {print}' .tool-versions | awk '{print $2}')"


upper_bound="$(echo "$lower_bound" | awk -F'.' '{print$1"."$2 + 1}')"

# to avoid traversing unnecessary folders, will run a single command for root pyproject update
find ./py -name "*pyproject.toml" -print0 | xargs -0 sed -i '' "s/^python =.*/python = \">=$lower_bound <$upper_bound\"/g"
sed -i '' "s/^python =.*/python = \">=$lower_bound <$upper_bound\"/g" ./pyproject.toml


find ./py -name "*pyproject.toml" -execdir "$DIR"/update-poetry-python-vers.sh "$lower_bound" \;
"$DIR"/update-poetry-python-vers.sh "$lower_bound"


find ./py -name "*pyproject.toml" -execdir poetry lock --no-update \;
poetry lock --no-update
