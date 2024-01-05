# Creating a new Go gRPC Service

## Create Proto Definition of Service

[Example PR](https://github.com/*company-data-covered*/services/pull/98)

The first step is to create the proto definition of the service; this is the descriptive interface for your service. By convention, each RPC (aka API endpoint) that we define has an input proto ending in `Request` and an output proto ending in `Response`. For example, the rpc `GetPatient` will take in an input proto called `GetPatientRequest` and an output proto called `GetPatientResponse`.

For a more in-depth explanation of gRPC endpoints, see [the official documentation](https://grpc.io/docs/what-is-grpc/introduction/).

## Create the Go server

Under the `go/cmd/` directory, create a directory for your new service. Under that directory, create two files: `main.go` and `grpc_server.go`.

`grpc_server.go` will be the implementation of the service that was defined in the proto. `main.go` is the entrypoint into the service.

### Monitoring

In order to add the InfluxDB/Grafana monitoring for your new service, we need to add gRPC interceptors to our service in [`main.go`](main.go). `baseserv.NewServer()` will handle this for us, as long as `InfluxEnv` is set.

Once that's done, InfluxDB will start recording measurements for latency and errors every time any gRPC is called on your service.

If InfluxEnv.URL is empty, then NewInfluxRecorder will return nil. In development, we typically keep InfluxEnv.URL empty so that we don't have to set up Influx and Grafana. To run Influx and Grafana locally, we can run `make ensure-dev-monitoring` to create the docker containers and `make clean-dev-monitoring` to stop them.

```sh
# Run influxDB and grafana locally. If there are new changes to be picked up, recreate the containers.
make ensure-dev-monitoring

# Bring up your service
INFLUXDB_DB=test INFLUXDB_URL=http://localhost:8086 make run-go-example-service

# Stop running influxDB and grafana locally
make clean-dev-monitoring
```

To confirm InfluxDB is working locally, we can run the following commands:

```sh

docker ps
# get container id from docker ps
docker exec -it CONTAINER_ID bash
influx

# Within the Influx shell
create database exampledb;
use exampledb;
# trigger an RPC in a separate shell with
# bin/grpcurl -plaintext localhost:8081 example.ExampleService/GetVersion
select * from ExampleServiceLatency;
```

You can also navigate to Grafana in a web browser, which by default is located at `localhost:5001`.

### Authorization

Similar to monitoring, authorization for incoming gRPC calls is also added via gRPC interceptors in [`main.go`](main.go).

Authorization is enabled by default; it can be disabled by modifying the `AUTHORIZATION_DISABLED` environment variable in `.env.development.local`.
Instructions for testing a gRPC call with authorization can be found in the top level [README.md](https://github.com/*company-data-covered*/services/blob/trunk/README.md)

`baseserv.NewServer()` will handle setting up authorization for us.

### Auth0

#### How to get access

Access to Auth0 will not be granted, instead changes to Auth0 should be made via
[the terraform found here](https://github.com/*company-data-covered*/infra/tree/trunk/terraform/auth0).

## Deploy

### GitHub Action

On `.github/workflow` directory create new build file `build_example_service.yml`:

```yaml
name: Build Example Service

run-name: ${{ inputs.ref || github.ref }}

on:
  workflow_dispatch:
    inputs:
      ref:
        description: The sha to build, otherwise builds HEAD of branch
        type: string
        required: false
  push:
    branches:
      - trunk

jobs:
  build-example-service-container:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          ref: ${{ inputs.ref || github.ref }}

      - name: Build and Push Docker Container
        uses: ./.github/actions/build_and_push_docker
        with:
          image_name: example-service
          dockerfile: docker/go.Dockerfile
          docker_port: 8000 8001
          docker_registry_url: ${{ secrets.DH_DOCKER_REGISTRY_URL }}
          docker_registry_username: ${{ secrets.DH_DOCKER_REGISTRY_PUSH_USERNAME }}
          docker_registry_password: ${{ secrets.DH_DOCKER_REGISTRY_PASSWORD }}
```

In `name` and `image_name` lines enter your service name.

In `docker_port` line enter your service port(s).

1. Add your service name to `.github/workflows/manual_deploy_service_to_aptible.yml` file to options on line 44.

2. Create a PR, but don't run the deploy yet; deploy will be done in the next section, after the Aptible app is created.

3. After merging PR you can deploy the service [here](https://github.com/*company-data-covered*/services/actions/workflows/manual_deploy_service_to_aptible.yml).

4. Click `Run workflow` button and select your service and environment for deploy.

#### OPTIONAL: If you need build and deploy your service from a non-trunk branch:

1. Go to [github actions](https://github.com/*company-data-covered*/services/actions) and select build workflow for your service(i.e. Build Example Service).
2. Click `Run workflow` button and select your branch.
3. After the build, you will see `Annotations` on your job, copy SHA after the service name (Built /example-service:**860e9f5f637275844436687af0f961574d37f7ce**).
4. Open [Deploy Service To Aptible](<[here](https://github.com/*company-data-covered*/services/actions/workflows/manual_deploy_service_to_aptible.yml)>) workflow.
5. Click `Run workflow` button and select your service and environment from dropdown and paste your SHA for deploy.

NOTE: Copy/pasting the sha is only necessary if you want to deploy a specific commit. If you want to deploy the most recent commit of a branch (HEAD) then by default the deploy workflow will attempt to deploy that image.

### Aptible

Create a file suffixed with `-entrypoint.sh` under the `docker` directory named after your service (i.e. `example-service-entrypoint.sh`).
If no `-entrypoint.sh` file is created, it will default to using `default-entrypoint.sh`, which will just run the app with default flag arguments.

In the `-entrypoint.sh` file, run the app with `/app`. If any flags need to be passed in, they can be passed in here in the `-entrypoint.sh` file.

Note: Any environment variables will only be available if they are set with `aptible config:set`.

For example,

```sh
#!/bin/sh
/app "--example-flag=$FLAG_DEFINED_IN_APTIBLE_CONFIG"
```

We will need both the [Aptible UI](https://dashboard.aptible.com/) and the [Aptible CLI](https://confluence.*company-data-covered*.com/display/DEV/Aptible).
In the Aptible UI, click `Create App` for the `staging1` (aka QA), `integration` (aka UAT), and `dispatch-health` (aka prod) environments.

For each:

1. Create an app for each environment named after your environment and suffixed with the env. For example, `example-service-qa`, `example-service-uat`, and `example-service`.
2. Run the github action deploy from the PR created.
3. OPTIONAL: If your service needs setup environment variables:

```sh
  aptible config:set \
    --app example-service-qa \
    ENV1=VALUE \
    ENV2=VALUE
```

To get the current environment variables:

```sh
  aptible config \
    --app example-service-qa
```

4. Identify the `APTIBLE_SERVICE_NAME` of your service. This is typically found in the `Procfile` or in the Services section of your app in Aptible's UI (e.g. for `example-service-qa:service`, the Aptible Service name is `service`).
5. [Create a TCP endpoint](https://deploy-docs.aptible.com/docs/cli-endpoints-tcp-create) using the `aptible` command line interface . This can only be done after the GHA deploy has been run and the port has been `EXPOSE`d. Unless otherwise specified, the port for the Aptible endpoint will be the `EXPOSE`d port.

```sh
  aptible endpoints:tcp:create \
    --app example-service-qa \
    --internal \
    <APTIBLE_SERVICE_NAME>
```

If your service uses multiple ports set `--ports` argument after `APTIBLE_SERVICE_NAME`:

```sh
  aptible endpoints:tcp:create \
    --app example-service-qa \
    --internal \
    <APTIBLE_SERVICE_NAME> \
    --ports <YOUR_SERVICE_GRPC_PORT>
```

6. Once this command is run, there will be a hostname for your service. This hostname will only be accessible by other services hosted on Aptible within the same environment (so `example-service-qa` will only be accessible by other QA aptible apps).
7. OPTIONAL: If your service will also serve HTTPS endpoints (for example, via `grpc-gateway`), [create an HTTPS endpoint](https://deploy-docs.aptible.com/docs/cli-endpoints-https-create). The certificate fingerprint can be found in the Aptible web UI, under the Certificates tab for each environment, for the \*._company-data-covered_.com section.

```sh
  aptible endpoints:https:create \
    --app example-service-qa \
    --certificate-fingerprint <CERTIFICATE_FINGERPRINT> \
    --port <YOUR_SERVICE_HTTP_PORT> \
    <APTIBLE_SERVICE_NAME>
```

Note: the reason we have TCP internal endpoints as opposed to TLS is because:

1. Aptible doesn't support ALPN, which is required for TLS support for GRPC clients (other than `grpcurl` and `golang` clients).
2. Because we need to have TCP to work with GRPC clients, we make it `internal`, which means that it's firewalled so that only other services deployed on Aptible in the same environment can access it.
3. Once we move off of Aptible, we will want to migrate the endpoints to be TLS, as TLS is best practice from a security standpoint.

### Database Migrations

If database migrations are required, follow these steps.

For each:

1. Create your database in Aptible. DB name must be service_name-service-db-environment (i.e. example-service-db-qa).
2. In Aptible, copy the connection URL and set DATABASE_URL env to your service app (Step 3 in Aptible).
3. Repeat for all Environments.

### CNAME Record

[Create a PR to add a CNAME record for your service](https://github.com/*company-data-covered*/services/pull/359). This will create a `.*company-data-covered*.com` URL for your service.

### Station environment variables

If your service use GRPC from station, after create CNAME's you need add EXAMPLE_GRPC_URL environment variable to station dashboard.

```sh
  aptible config:set \
    --app dashboard-qa \
    EXAMPLE_GRPC_URL=example-service-grpc-qa.*company-data-covered*.com:8000
```

port after URL is required.
