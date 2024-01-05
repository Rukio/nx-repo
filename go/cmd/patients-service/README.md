# Patient Service

## Patients

A `Patient` is a composition of both the Station `Patient` record and the Athena `Patient` record. Calls to `GetPatient` will retrieve the latest information from Athena, while filling in any _company-data-covered_-specific information from Station.

### Search

There are two methods to search through patient records: `SearchPatients` and `ListPatients`.

`ListPatients` requires an explicit first name, last name, and birthdate, and is implemented using Athena's [`enhancedbestmatch`](https://docs.athenahealth.com/api/api-ref/patient#Get-list-of-patients---enhanced-best-matching-search-criteria) endpoint.

`SearchPatients` take a single search term in the format `last, first` or `athenapatientid`, and is implemented using Athena's [`search`](<https://docs.athenahealth.com/api/api-ref/patient#Get-list-of-patients---(optional)-visible-to-a-practitioner>) endpoint.

### Insurance

PatientsService also exposes the ability to retrieve or modify patient insurance records, as well as add images of insurance cards (back and front).

An eligibility check can be triggered by calling `TriggerPatientInsuranceEligibilityCheck`; this is a synchronous call. After a period of time lasting up to 2 minutes, `GetPatientInsuranceBenefitDetails` can be called to retrieve the raw 271 response, or `GetInsurance` can be called to retrieve the insurance record with the latest eligibility status.

### Unverified Patients

An `UnverifiedPatient` is patient information that has been uploaded by an account holder. The `UnverifiedPatient` may or may not have a reference to a [`Patient`](#patients), but crucially, the `UnverifiedPatient` should never see any updates made to the `Patient`. This is to allow account holders to request care and upload insurance on behalf of another patient without exposing that patient's information before permission is verified. Updates to an `UnverifiedPatient` will not be reflected in a `Patient` record it may have a reference to.

To add a reference to a `Patient`, a client will call `FindOrCreatePatientForUnverifiedPatient`. This will either find an existing `Patient` record that matches the given `UnverifiedPatient`, or create a new one; a side effect of creating a new `Patient` record is that records will be created in Athena and Station as well.

Note: Just because a `Patient` is created does not mean it is attached to the patient account; a separate gRPC call to `patientaccounts-service` to `AddAccountPatientLink` will be required for that.

### Care Team & Pharmacy

PatientsService also exposes endpoints to retrieve or modify the `CareTeam` or `Pharmacy` for a patient. Clients can call the relevant endpoints to update the `PrimaryCareProvider`, `CareTeam`, `DefaultPharmacy`, and `PreferredPharmacies` for a patient. These requests will be proxied to Station and ultimately make changes in the Athena record.

## Running Patient Service

1. Run `make run-station-stack` in the station directory.
2. In a separate tab, run `scripts/run/patients_service.sh`; this will bring up the whole stack of services.

Alternatively, if that's not working:

1. Run `audit-service`, `athena-service`, and `station`. Instructions should be in the relevant README.md files.
2. Then, run:

```sh
make ensure-dev-db-patients && DATABASE_URL=postgres://postgres@localhost:5433/patients?sslmode=disable make run-go-patients-service
```
