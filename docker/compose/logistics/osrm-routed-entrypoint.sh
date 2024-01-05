#!/bin/bash

set -euxo pipefail

if [ -z "${OSM_FILE_BASE:-}" ]; then
    echo "Missing OSM_FILE_BASE environment variable (e.g., OSM_FILE_BASE=nevada-latest)"
    echo ""
    echo "Rerun with:"
    echo "  OSM_FILE_BASE=nevada-latest OSRM_ALGO=mld ${script_name}"
    echo ""

    exit 1
fi

if [ -z "${OSRM_ALGO:-}" ]; then
    echo "Missing OSRM_ALGO environment variable (e.g., OSRM_ALGO=mld or OSRM_ALGO=ch)"

    exit 1
fi

OSRM_ARCH=$(uname -m)
OSRM_VERSION=$(osrm-extract -v)
CONVERT_OSM_FILE_BASE="${OSM_FILE_BASE}.${OSRM_ALGO}.${OSRM_VERSION}.${OSRM_ARCH}"

# Note: osrm-routed incorrectly does a regex on "osrm", so will break a directory named "osrm", so change working directory
cd "/data/${CONVERT_OSM_FILE_BASE}.osrm.latest/"

# Run with mmap for low memory usage, but slightly lower performance.
# https://github.com/Project-OSRM/osrm-backend/pull/5242
exec osrm-routed \
    --algorithm "${OSRM_ALGO}" \
    --mmap \
    --max-table-size "${OSRM_MAX_TABLE_SIZE:-10000}" \
    "${CONVERT_OSM_FILE_BASE}"
