# Patient Sequence Diagrams

## Patient Workflows

Standard workflows:

```mermaid
sequenceDiagram
  %% Nodes
  participant Client
  participant Patients Service
  participant PatientsSvcDB as Patients Service DB
  participant Athena Service
  participant StationPatientGRPC as Station Patients gRPC

  rect rgba(255, 125, 0, .05)
      note right of Client: Get Unverified Patient
      Client->>Patients Service: Request unverified patient info by ID
      Patients Service->>PatientsSvcDB: Read unverified patient info
      Patients Service->>Client: Returns unverified patient info
  end

  rect rgba(255, 0, 255, .05)
      note right of Client: Get Patient
      Client->>Patients Service: Request patient info by patient ID
      Patients Service->>StationPatientGRPC: Get Patient by ID
      StationPatientGRPC->>Patients Service: Return Patient
      Patients Service->>Athena Service: Request Athena Patient
      Athena Service->>Patients Service: Return Athena patient information
      Patients Service->>Patients Service: Compose With Athena Patient using patient from station
      Patients Service->>Client: Returns patient info
  end

  rect rgba(255, 125, 0, .05)
      note right of Client: Find or Create Patient for Unverified Patient
      Client->>Patients Service: Request unverified patient info by ID
      Patients Service->>PatientsSvcDB: Read unverified patient info
      alt Unverified patient has patient id
          Patients Service->>Patients Service: Get Patient using patient ID from unverified patient
          Patients Service->>Client: Returns unverified patient info
      else Unverified patient has no patient id
          Patients Service->>Patients Service: Create Patient with unverified patient and billing city ID
          Patients Service->>PatientsSvcDB: Update Unverified Patient By ID using created patient id for PatientID
          Patients Service->>Client: Returns unverified patient info
      end
  end

    rect rgba(255, 0, 255, .05)
        note right of Client: Create Patient
        Client->>Patients Service: Request patient create with patient info
        Patients Service->>StationPatientGRPC: Get Department ID By Billing City ID
        StationPatientGRPC->>Patients Service: Return Department ID
        Patients Service->>Athena Service: Request Athena Enhanced Best Match
        Athena Service->>Patients Service: Return EBM results Athena patient
        alt EBM returns no match
            Patients Service->>Athena Service: Create Patient with patient info
            Athena Service->>Patients Service: Return Athena Patient with patient info
        end
        Patients Service->>StationPatientGRPC: Find or Create Patient with patient info and ehr_id (from Athena patient)
        StationPatientGRPC->>Patients Service: Return found or created Patient
        Patients Service->>Patients Service: Get Patient by Patient ID (from station call)
        Patients Service->>Client: Returns patient info
  end
```

Notes:

- We will use Athena [Enhanched Best Match](https://docs.athenahealth.com/api/workflows/enhanced-best-match), to determine if a `patient` has an Athena record, on Patient Create. If an appropriate match is found we use the Athena patient to call `station` gRPC endpoint `FindOrCreatePatient` which will query `station` DB using the `ehr_id` (Athena patient ID)
- In the EBM request `ReturnBestMatches` and `UseSoundexSearch` will be set to `false` to increase strength of match. A score of 26 or greater will be required to select patient from EBM results.
