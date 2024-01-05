# Acuity Model Server

Wraps the Acuity Models with Grpc server code + tests

**Note:**
No integrations tests, as this currently uses the asyncio version of the grpc server,
which wont play nice with pytest.

## Calling from dashboard

If you'd like to verify return values from calling the service via station, run:

1. SSH into Aptible:

```bash
aptible ssh --app dashboard-qa
```

2. Start a rails console:

```bash
./bin/rails c
```

3. Create a new Acuity model client:

```ruby
client = MlModels::Acuity::Client.new
```

4. Obtain a `care_request` ID.

You will need a `care_request` ID to send a request. You can use any `care_request` ID. The following example retrieves the last `care_request` created:

```ruby
care_request = CareRequest.last
```

5. Call the Acuity Model Server:

```ruby
client.get_acuity_score('hallucinations', 30, care_request)
```

## Running the server

```bash
DD_ENV=qa STATSIG_SECRET_KEY=secret make run-python-server-acuity-model-server
```
