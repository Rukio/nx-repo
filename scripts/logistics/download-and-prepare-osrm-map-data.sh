#!/bin/bash

set -euxo pipefail

script_name="$0"

DOCKER="${DOCKER:-docker}"
OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend
OSRM_CMD="${DOCKER} run --rm ${OSRM_IMAGE}"

if [ -z "${OSM_FILE_BASE:-}" ]; then
    echo "Missing OSM_FILE_BASE environment variable (e.g., OSM_FILE_BASE=nevada-latest)"
    echo "Opening up download page to help you find an appropriate one."
    echo ""
    echo "Rerun with:"
    echo "  OSM_FILE_BASE=nevada-latest OSRM_ALGO=mld ${script_name}"
    echo ""

    read -n 1 -s -r -p "Press any key to open download page..."
    open "https://download.geofabrik.de/north-america/us.html"
    echo ""
    echo ""

    exit 1
fi

if [ -z "${OSRM_ALGO:-}" ]; then
    echo "Missing OSRM_ALGO environment variable (e.g., OSRM_ALGO=mld or OSRM_ALGO=ch)"

    exit 1
fi

TIMESTAMP=$(date -u +%Y%m%d_%H%M%SZ)
OSRM_VERSION=$(${OSRM_CMD} osrm-extract -v)
OSRM_ARCH=$(${OSRM_CMD} uname -m)

GEN_DIR="${PWD}/generated/osrm"
PROCESSED_DIR="${GEN_DIR}/processed"
CONVERT_OSM_FILE_BASE="${OSM_FILE_BASE}.${OSRM_ALGO}.${OSRM_VERSION}.${OSRM_ARCH}"
OUT_BASE_FILENAME="${CONVERT_OSM_FILE_BASE}.osrm.${TIMESTAMP}"
OUT_BASE_LATEST_LINK="${CONVERT_OSM_FILE_BASE}.osrm.latest"
OUT_DIR="${PROCESSED_DIR}/${OUT_BASE_FILENAME}"

mkdir -p "${GEN_DIR}" "${OUT_DIR}"

SRC_FILE_TMP="${GEN_DIR}/${OSM_FILE_BASE}.osm.pbf.part"
SRC_FILE="${GEN_DIR}/${OSM_FILE_BASE}.osm.pbf"

if [ -f "${SRC_FILE}" ]; then
  ls -l "${SRC_FILE}"
else
  DOWNLOAD_URL="https://download.geofabrik.de/north-america/us/${OSM_FILE_BASE}.osm.pbf"
  if [[ "${OSM_FILE_BASE}" == us-* ]]; then
    DOWNLOAD_URL="https://download.geofabrik.de/north-america/${OSM_FILE_BASE}.osm.pbf"
  fi

  curl --fail -o "${SRC_FILE_TMP}" "${DOWNLOAD_URL}"

  mv "${SRC_FILE_TMP}" "${SRC_FILE}"
fi

mkdir -p "${OUT_DIR}"
time cp "${SRC_FILE}" "${OUT_DIR}/${CONVERT_OSM_FILE_BASE}.osm.pbf"

DOCKER_INTERACTIVE_ARG="--interactive"
if [ "${INTERACTIVE:-true}" != "true" ]; then
  DOCKER_INTERACTIVE_ARG=""
fi

time ${DOCKER} run \
    --name osrm-prep \
    --rm \
    ${DOCKER_INTERACTIVE_ARG} \
    -t \
    -e OSM_FILE_BASE="${CONVERT_OSM_FILE_BASE}" \
    -e OSRM_ALGO="${OSRM_ALGO}" \
    -v "${PWD}/docker/compose/logistics:/scripts" \
    -v "${OUT_DIR}:/data" \
    "${OSRM_IMAGE}" \
    bash /scripts/convert-pbf-to-osrm-entrypoint.sh

cd "${PROCESSED_DIR}"
rm -f "${OUT_BASE_LATEST_LINK}"
ln -s "${OUT_BASE_FILENAME}" "${OUT_BASE_LATEST_LINK}"

if [ "${ARCHIVE:-}" = "true" ]; then
  TAR_COMPRESS_PROGRAM=${TAR_COMPRESS_PROGRAM:-gzip}
  TAR_OUT_EXT=${TAR_OUT_EXT:-gz}
  TAR_OUT_FILENAME="${OUT_BASE_FILENAME}.tar.${TAR_OUT_EXT}"
  TAR_OUT_FILENAME_TMP="${OUT_BASE_FILENAME}.tar.${TAR_OUT_EXT}.part"

  tar --use-compress-program "${TAR_COMPRESS_PROGRAM}" -cvf "${TAR_OUT_FILENAME_TMP}" "${OUT_BASE_FILENAME}/${CONVERT_OSM_FILE_BASE}".osrm.*
  mv "${TAR_OUT_FILENAME_TMP}" "${TAR_OUT_FILENAME}"
  ls -l "${PROCESSED_DIR}/${TAR_OUT_FILENAME}"
fi
