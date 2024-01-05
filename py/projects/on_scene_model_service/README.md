# On-scene model service

This package defines the Python gRPC service for the on-scene model. The configuration
follows the example for Tele-p model server, and instructions to test this server
both locally and in QA are similar with two main differences:

1. Request structures are different;
2. On-Scene model pulls features from feature store so some additional AWS credentials need to be set up.

## How to test locally

### Pre-requisites

Make sure you have the following AWS credentials set up to access Sagemaker feature store:

1. You have a user created for you under our `dataops` account (i.e., there is a `iam_user_[your_user_name].tf` in [this directory](https://github.com/*company-data-covered*/infra/tree/trunk/terraform/aws/dataops/iam).)
2. You are added in one of the following groups [here](https://github.com/*company-data-covered*/infra/blob/trunk/terraform/aws/dataops/iam/iam_user_groups.tf#L2-L53):
   1. `de_users`
   2. `ds_users`
   3. `eng_ml_users`

### Steps

We haven't created a `make` command to run the server yet, so for now we'll use
the following steps:

1. `make gen-sql` <- from root dir (`../services`)
2. `cd ../services/py/projects/on_scene_model_service`
3. `poetry install && poetry run python on_scene_model_service/server.py --local`

Alternatively, to run server with local dev database, run this:

```bash
DATABASE_URL=postgresql://postgres@localhost:5433/on_scene_model?sslmode=disable poetry run python on_scene_model_service/server.py --local
```

We will send the following example request:

```json
{
  "care_request_id": "12345",
  "protocol_name": "Head Injury",
  "service_line": "Acute Care",
  "place_of_service": "Home",
  "num_crs": 1,
  "patient_dob": {
    "year": 1990,
    "month": 7,
    "day": 11
  },
  "risk_assessment_score": 1.0,
  "shift_teams": [{ "id": 1, "member_ids": [95923, 42561] }]
}
```

You can use either Postman (see instructions [here](https://github.com/*company-data-covered*/services/blob/trunk/py/projects/telep_model_server/README.md#sending-a-request-using-postman))
or use grpcurl (first move to the top-level directory of `services` repo):

```bash
grpcurl -plaintext -import-path ./proto -proto proto/ml_models/on_scene/service.proto -d '{
    "care_request_id": "12345",
    "protocol_name": "Head Injury",
    "service_line": "Acute Care",
    "place_of_service": "Home",
    "num_crs": 1,
    "patient_dob": {
        "year": 1990,
        "month": 7,
        "day": 11
    },
    "risk_assessment_score": 1.0,
    "shift_teams": [
        {"id": 1, "member_ids": [95923, 42561]}
    ]
}' localhost:50051 ml_models.on_scene.OnSceneService/GetOnSceneTime
```

## How to test in QA

One can test this in `dashboard-qa`:

1. SSH into `dashboard-qa`: `aptible ssh --app dashboard-qa` (will likely need to run `aptible login` first)
2. Start ruby console: `./bin/rails c`
3. If you have a particular care request ID in mind, then you can do something like this: `MlModels::ETOC::HTTPClient.new.estimated_minutes_for_care_request(CareRequest.find(1857643))`
   1. Or you can find the latest care request ID by `cr = CareRequest.where(id: RiskAssessment.last.care_request_id).last` and then `MlModels::ETOC::HTTPClient.new.estimated_minutes_for_care_request(cr)`
