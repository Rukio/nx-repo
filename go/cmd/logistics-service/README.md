# Logistics Service

## Appendix

### Using Open Source Routing Machine(OSRM) locally on docker

1. Run script to get some Open Street Maps (OSM) data for use with OSRM. The script will make a folder `/generated/osrm` and download data if needed. If you're unsure what data you need, the script will automatically open a browser for you.

```sh
# Get and process an Open Street (OSM) file for use with Maps OSRM compatible data file.
OSM_FILE_BASE=nevada-latest OSRM_ALGO=mld scripts/logistics/download-and-prepare-osrm-map-data.sh

# No idea what you want? Just run to open browser for data sources and pick one.
scripts/logistics/download-and-prepare-osrm-map-data.sh
```

2. Run OSRM in docker:

```sh
OSM_FILE_BASE=nevada-latest OSRM_ALGO=mld make run-docker-osrm
```

3. Check it works:

```sh
# OSRM: Nevada directions
curl -v "http://127.0.0.1:5050/route/v1/driving/-115.256579,36.167132;-115.227789,36.235048?steps=true"
```

### Running Demo Web Server

For fast Optimizer iteration, there's a Dev web server built into the the `logistics-service`, enabled by `--dev-server`.

```sh
# Run Optimizer
make run-java-logistics-optimizer

# Run OSRM from above, after generating data
OSRM_MAX_TABLE_SIZE=45000 OSM_FILE_BASE=nevada-latest OSRM_ALGO=mld make run-docker-osrm

# Run Station (optional)
# On Station project (https://github.com/*company-data-covered*/station)
# this step is needed to be able to communicate between station and logistics-service
make run-station-stack

# Build and run the service, passing in the flag to enable the dev server.
# Will startup database and migrate schema as necessary.
make build-go-logistics-service ensure-dev-db-logistics && \
    DATABASE_URL=postgres://postgres@localhost:5433/logistics env $(xargs < .env.development.local) generated/bin/go/cmd/logistics-service/logistics-service \
        --optimizer-grpc-addr localhost:8081 \
        --optimizer-settings-poll-interval 10s \
        --statsig-optimizer-settings-refresh-interval 1m \
        --grpc-listen-addr :8082 \
        --http-listen-addr :8079 \
        --station-grpc-addr localhost:9001 \
        --use-google-maps=false \
        --dev-server

# Open web browser, changing parameters as desired to try different versions of generated problems.

# 2 shift teams, 15 visits, Vegas
open "http://localhost:8079/static/?shift_teams=2&visits=15&city=vegas&vrp_termination_ms=1000"

# 2 shift teams, 15 visits, Denver
open "http://localhost:8079/static/?shift_teams=2&visits=15&city=denver&vrp_termination_ms=1000"

# 20 shift teams, 170 visits
open "http://localhost:8079/static/?shift_teams=20&visits=170&vrp_termination_ms=10000"

# 4 shift teams, 40 visits, Tokyo, 5 seconds solve time, Use a random seed of 123, don't automatically solve after getting problem
open "http://localhost:8079/static/?shift_teams=4&visits=40&city=tokyo&vrp_termination_ms=5000&vrp_rand_seed=123&auto_solve=0"
```
