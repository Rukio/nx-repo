#!/bin/bash

set -euxo pipefail

OUT_DIR="/data"

time osrm-extract -d osmosis -p /opt/car.lua "${OUT_DIR}/${OSM_FILE_BASE}.osm.pbf"

OSRM_FILE="${OUT_DIR}/${OSM_FILE_BASE}.osrm"

if [ "${OSRM_ALGO}" = "ch" ]; then
    time osrm-contract "${OSRM_FILE}"
elif [ "${OSRM_ALGO}" = "mld" ]; then
    time osrm-partition "${OSRM_FILE}"
    time osrm-customize "${OSRM_FILE}"
else
    echo "Unknown OSRM_ALGO: ${OSRM_ALGO}"
    exit 1
fi

chmod a+r "${OUT_DIR}"/*
