# gRPC Server for Tele-p ML Models

## Release Notes

- [2023-09-11] Released v1.3 model in prod, which adds `NOTES` clinical override rule that excludes CRs from hybrid if their dispatcher & secondary screener notes contain certain curated keywords
- [2023-08-23] Basic-v1.2 and enhanced-v1.2 in prod with updates to the following clinical override rules:
  - turn off hybrid for epistaxis/nose bleed
  - turn off hybrid for abdominal pain at age >= 65
  - turn off nausea/vomitting/diarrhea at age >= 65
- [2023-08-03] Released v1.1 model in COL
- [2023-07-10] Released v1.1 model in LAS, POR, ATL, TUS
- [2023-07-03] Released v1.1 model in DEN, PHX, SAT, CLE, HOU
- [2023-06-16] Basic-v1.1 and enhanced-v1.1 in prod with the addition of clinical override rules approved by CGC
- [2023-03-20] Released v1.0 model in prod in KNX, NSH, RIC

## How to test locally

Here are the main steps:

1. Spin up local dev DB.
2. Run the tele-p model server locally (i.e., on your computer);
3. Send request to tele-p model server and get the expected response back using
   either Postman or from `station` (if you have `station` set up locally).

### Spin up local dev DB

Run the following commands under `services/`:

```
$ make clean-dev-db  # this is to clean up previous dev DBs locally
$ make ensure-dev-db-telep-model-server  # this spins up local dev DB with the correct schema
```

### Running server locally

You can run the model server on your own machine, send requests to it, and get
responses back. Before doing this, you need to ensure you have the following:

1. AWS credential that has access to our `dataops` buckets. This is needed to
   read S3 buckets for model registry (`s3://prod.ml-model-registry.*company-data-covered*`) and
   risk protocol mapping (`s3://prd.risk-protocol-names`). Note that it uses
   the profile `$AWS_PROFILE`; if it is not set, it looks for the `default`
   profile. May have to set `AWS_PROFILE=mfa` after MFA enforcement.
2. Statsig secret key: you need the env variable `STATSIG_SECRET_KEY` set
   properly. You can go to the Statsig console to get your own secret key.
3. Set `DATABASE_URL=postgresql://postgres@localhost:5433/telep_model_server?sslmode=disable` for
   local dev-db.
4. Generate sql files `make gen-sql`

With the above ready, you can run the server locally in two ways:

#### a)

- Running `make run-python-server-telep-model-server`

#### b)

1. Move to the tele-p model server directory:
   `cd ${GITHUB_DIR}/services/py/projects/telep_model_server`.
   - Replace `${GITHUB_DIR}` with where Github lives on your
     machine (on my machine it's just `$HOME/Github`).
2. Start the server: `poetry run python telep_model_server/server.py --local`.
   You need the `--local` flag to test it locally (so it ignores auth interceptor
   that only allows station to call it).
   - if you did not install the poetry environment, first run `poetry install`.
   - If you get AWS "Access Denied" error, you might want to set the correct `$AWS_PROFILE`
     env var to use a different AWS profile that gives you the right permission to S3 buckets.
     For example, setting `AWS_PROFILE=mfa` will use the `mfa` profile, which is
     what we use for dataops account after MFA is enforced for all users.

### Sending a request using Postman

1. Use a tool that can send gRPC requests. I'm using [Postman](https://www.postman.com/)
   but you might know/prefer other tools. Here is Postman's [documentaion](https://learning.postman.com/docs/sending-requests/grpc/grpc-request-interface/) on using the gRPC
   request interface. I'm going to use Postman for the steps that follow.
2. Use the following properties for your gRPC request:
   - URL `localhost:50051`
   - import this proto definition: `services/proto/ml_models/telep/service.proto`
   - Add the import path: `services/proto`
   - the first time you import, you need to create a new API in Postman (see this [documentation](https://learning.postman.com/docs/sending-requests/grpc/using-service-definition/#importing-a-proto-file))
3. Postman recognizes proto definitions and lets you populate your message body
   with proto enums; here is an example:
   ```
   {
      "risk_protocol": "Head Injury",
      "patient_age": 2,
      "risk_score": 0.2,
      "place_of_service": "Home",
      "market_name": "XYZ",
      "timestamp": {"year": 2023, "month": 2, "day": 23, "hours": 16, "minutes": 50, "seconds": 0, "nanos": 0},
      "gender": "SEX_MALE"
   }
   ```
4. Send ("Invoke" in Postman) the request and you should get the response back:
   ```
   {
      "eligible": false
   }
   ```
5. After your tests, stop the server with Ctrl+C.

### Sending a request using grpcurl

From the root of the services directory run grpc using the `-import-path` flag:

```bash
grpcurl -plaintext -import-path ./proto -proto proto/ml_models/telep/service.proto -d '{
  "risk_protocol": "Head Injury","patient_age": 2,"risk_score": 0.2,"place_of_service": "Home","market_name": "XYZ","timestamp":
{"year": 2023, "month": 2, "day": 23, "hours": 16, "minutes": 50, "seconds": 0, "nanos": 0},"gender": "SEX_MALE"
}' localhost:50051 ml_models.telep.TelepV1Service/GetEligibility
```

## How to test in QA

Here are the main steps:

1. Deploy tele-p model server to QA (either `trunk` or your local branch);
2. Send request from `station` in QA.

### Deploy tele-p model server to QA

This is the same as deploying any other app to QA. If you're not familiar already,
here are the steps:

1. On Github, go to "[Actions](https://github.com/*company-data-covered*/services/actions)"
   tab in the `services` repo, then select "Build Telep Model Server". Click on
   the "Run workflow" button near the top-right corner. In the drop-down menu,
   select the branch (either `trunk` or your dev branch), then click the green
   button "Run workflow". Wait for the image to be built.
2. After step 1, select the Github Action "Deploy Service to Aptible" (might
   need to click "Show more workflows..." to see this one.). Again click on the
   "Run workflow" button near the top-right corner. In the drop-down
   menu that appears, **first** select your branch (either `trunk` of your dev
   branch), **then** select `telep-model-server` as "Name of the service to deploy".
   Finally, select `qa` as the "Environment to deploy to".
3. **VERIFY** that all the fields above are set correctly, then hit the green
   button "Run workflow". Note that if you change the branch, the name of the
   service could be reset to `patients-service`, so beware of that.
4. Wait for the deploy job to finish. You can see the action running in the Actions
   tab.

### Sending a request from station in QA

You probably only need this if you're doing dev work on the tele-p model server.

The tele-p model server in QA should already have the needed AWS & Statsig
credentials set up. We also assume that you have Aptible access. If you have
issues related to credentials, please ask around for help (e.g. in #eng-core-help).

Here are the steps to ssh into Aptible and send a request from `station`:

1. In a terminal window, SSH into Aptible:

`aptible ssh --app dashboard-qa`

2. Start a rails console:

`./bin/rails c`

3. Create a new telep model client:

`client = MlModels::Telep::Client.new()`

4. We need a `care_request_id` to send a request. For example, we can use a recent
   `care_request_id` (from the real world) like this:

   `cr = CareRequest.where(id: RiskAssessment.last.care_request_id).last`

   - alternative way to get a recent care request ID:

     `RiskAssessment.joins(:care_request).where(care_requests: { request_status: 'complete' }).last.care_request_id`

5. Call the wrapper function that sends a request to tele-p model server using
   a `care_request_id`:

   `client.get_care_request_eligibility(cr.id)`

### Checking the modality provided to a historical care request via ModalityLog table

You can check the historical modalities via the modality log table:

1. In a terminal window, SSH into Aptible:

`aptible ssh --app dashboard-prod`

2. Start a rails console:

`./bin/rails c`

3. Get modality logging for given care Request

`CareRequestModalitiesLog.where(care_request_id: CARE_REQUEST_ID_INT)`

## How to release new versions

### Run new versions in shadow mode

Before releasing a new version to prod, one should first run it in shadow mode (meaning that we call the new version in prod but not use its output) for at least a few days. Here are the steps to add new version(s) to shadow mode:

1. Add a new config for the new version. Need to follow the naming convention `hybrid-model-config-[basic|enhanced]-{semantic_version_str}`, where `[basic|enhanced]` means the new version should be either in a `basic` market (where DHMTs cannot administer IV and medication) and in an `enhanced` market. `semantic_version_str` is semantic version (e.g., `v1.1`) with dots replaced by `p` (e.g., `v1p1`). An example config is [here](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/hybrid-model-config-basic-v1p3).
2. Update service config `telep-ml-service-config-v2` and add the new versions under the `shadow` section. The `shadow` section should look like this (assuming we're adding `v1.1` to shadow):

```yaml
shadow:
  {
    default: ['basic-v1.1'],
    market_overrides: { phx: ['enhanced-v1.1'], tus: ['enhanced-v1.1'] },
  }
```

Note that we could run multiple versions in shadow, so each entry should be a list. Make sure the `prod` environment sees the updated config.

3. Re-deploy `telep-model-server` to prod to take effect.

### Launch new version to prod

After running the new version in shadow for a few days and everything looks good, one can launch it to prod with the following steps:

1. Update `telep-ml-service-config-v2` to have the `factual` section use the new version like this (assuming we're launching `v1.1`):

```yaml
factual:
  {
    default: 'basic-v1.1',
    market_overrides: { phx: 'enhanced-v1.1', tus: 'enhanced-v1.1' },
  }
```

Note that we only have one version in `factual` for each market so make sure each entry is not a list. Also make sure to remove the new version from shadow.

2. Re-deploy `telep-model-server` to prod.
