# Patient Accounts Sequence Diagrams

## Account Workflows

Standard workflows:

```mermaid
sequenceDiagram
    %% Nodes
    participant Client
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant Auth0

    rect rgba(255, 0, 255, .05)
        note right of Client: Get Account
        Client->>AccountsSvc: Request account info by account ID
        AccountsSvc->>AccountsSvcDB: Read account info
        AccountsSvc->>Client: Returns account info
    end

    rect rgba(0, 255, 255, .05)
        note right of Client: Update Account Info without verification
        Client->>AccountsSvc: Request to update account info by account ID
        AccountsSvc->>AccountsSvcDB: Updates account info
        AccountsSvc->>Auth0: Updates account info including setting<br>is_*_verified flags to false accordingly
        AccountsSvc->>Client: Return updated account info
    end

    rect rgba(255, 125, 0, .05)
        note right of Client: Find or Create Account by Token
        Client->>AccountsSvc: Requests account info for token in request
        AccountsSvc->AccountSvc: Validates token
        AccountsSvc->AccountSvc: Parses claims from token<br>(auth0 ID and email)
        AccountsSvc->AccountSvcDb: Retrieves account exists by email

        opt Account does not exist
            AccountsSvc->AccountSvcDb: Creates account with info parsed from the token claims
        end

        AccountsSvc->>Client: Return account info
    end
```

### Communication Channel Verification

The below workflow can be used to verify communication channels for:

- validating the user is who they say they are (i.e., validating access to channel values already associated with the account)
- validating new values for communication channels (i.e., updating the account email)

The workflow can be used to validate emails and phone numbers (via both SMS and voice channels). The diagram below will describe the flow for email verification, but the general process is the same for any supported communication channel. The workflow is intentionally left open ended in the patient accounts service because the next steps depend on the purpose of the verification (e.g., identity verification or channel verification).

```mermaid
sequenceDiagram
    actor User
    participant Client as Client Application<br>(ex: Patient Portal)
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant Twilio

    AccountsSvc->>Twilio: Starts a verification with email
    par
        Twilio->>User: Sends OTP
    and
        Twilio->>AccountsSvc: Responds with verification details
        AccountsSvc->>Client: Responds with success
        Client->>User: Prompts for OTP
    end
    User->>Client: Provides OTP
    Client->>AccountsSvc: Checks verification with OTP
    AccountsSvc->>Twilio: Checks a verification with given OTP
    Twilio->>AccountsSvc: Responds with verification check details
    AccountsSvc->>Client: Responds with check details
```

### Email Update Workflow

[EDD Reference](../../../edd/patient-portal/account-profile-and-settings.md#verifying-communication-channels)

The following workflow leverages [Communication Channel Verification](#communication-channel-verification).

```mermaid
sequenceDiagram
    actor AccountHolder as Account Holder
    participant Portal as Patient Portal
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant Auth0

    AccountHolder->>Portal: Clicks "Edit" on email
    Portal->>AccountsSvc: Workflow: Communication Channel Verification<br>for current account phone number

    break Verification check is not approved
        AccountsSvc->>Portal: Responds with error
        Portal->>AccountHolder: Display error
    end

    AccountsSvc->>Auth0: Sets is_phone_verified flag to true
    AccountsSvc->>Portal: Responds with success
    Portal->>AccountHolder: Shows success
    Portal->>AccountHolder: Prompts for new email
    AccountHolder->>Portal: Provides email
    Portal->>AccountsSvc: Workflow: Communication Channel Verification<br>for new email

    break Verification check is not approved
        AccountsSvc->>Portal: Responds with error
        Portal->>AccountHolder: Display error
    end

    AccountsSvc->>AccountsSvcDB: Updates account email
    AccountsSvc->>Auth0: Updates account email and sets<br>is_email_verified flag to true
    AccountsSvc->>Portal: Responds with success
    Portal->>AccountHolder: Shows success
```

### Phone Update Workflow

[EDD Reference](../../../edd/patient-portal/account-profile-and-settings.md#verifying-communication-channels)

The following workflow leverages [Communication Channel Verification](#communication-channel-verification).

```mermaid
sequenceDiagram
    actor AccountHolder as Account Holder
    participant Portal as Patient Portal
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant Auth0

    AccountHolder->>Portal: Clicks "Edit" on phone number
    Portal->>AccountsSvc: Workflow: Communication Channel Verification<br>for current account email

    break Verification check is not approved
        AccountsSvc->>Portal: Responds with error
        Portal->>AccountHolder: Display error
    end

    AccountsSvc->>Auth0: Sets is_email_verified flag to true
    AccountsSvc->>Portal: Responds with success
    Portal->>AccountHolder: Prompts for new phone number
    AccountHolder->>Portal: Provides phone number
    Portal->>AccountsSvc: Provides phone number
    AccountsSvc->>AccountsSvcDB: Updates account phone number
    AccountsSvc->>Auth0: Updates account phone number and sets<br>is_phone_verified flag to false
    AccountsSvc->>Portal: Responds with success
    Portal->>AccountHolder: Shows success
```

## Account Address Workflows

```mermaid
sequenceDiagram
    %% Nodes
    participant Client
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant AddressValidateSvc as Google Address<br>Validation API

    rect rgba(255, 0, 255, .05)
        note right of Client: Create Account Address
        Client->>AccountsSvc: Request to create account address
        AccountsSvc->>AddressValidateSvc: Request address validation
        AddressValidateSvc->>AccountsSvc: Respond with address validation
        break Address is invalid
            AccountsSvc->>Client: Return error
        end
        AccountsSvc->>AccountsSvcDB: Save given info and lat/long<br>received from Google
        AccountsSvc->>Client: Return address
    end

    rect rgba(0, 255, 255, .05)
        note right of Client: List Account Addresses
        Client->>AccountsSvc: Request to list account address
        AccountsSvc->>AccountsSvcDB: Read account addresses
        AccountsSvc->>Client: Return addresses
    end

    rect rgba(255, 125, 0, .05)
        note right of Client: Delete Account Address by ID
        Client->>AccountsSvc: Request to delete account address
        AccountsSvc->>AccountsSvcDB: Delete account addresses
        AccountsSvc->>Client: Return success
    end

    rect rgba(255, 0, 255, .05)
        note right of Client: Read Account Address by ID
        Client->>AccountsSvc: Request to read account address
        AccountsSvc->>AccountsSvcDB: Retrieve account addresses
        AccountsSvc->>Client: Return address
    end

    rect rgba(0, 255, 255, .05)
        note right of Client: Update Account Address by ID
        Client->>AccountsSvc: Request to update account address
        opt Address fields have changed that would affect previous validation
            AccountsSvc->>AddressValidateSvc: Request address validation
            AddressValidateSvc->>AccountsSvc: Respond with address validation
            break Address is invalid
                AccountsSvc->>Client: Return error
            end
        end
        AccountsSvc->>AccountsSvcDB: Save given info, including new lat/long if revalidated
        AccountsSvc->>Client: Return address
    end
```

## Account Patient Workflows

```mermaid
sequenceDiagram
    %% Nodes
    participant Client as Client Service
    participant AccountsSvc as Patient Accounts Service
    participant AccountsSvcDB as Accounts Service DB
    participant PatientsSvc as Patients Service
    participant PatientSvcDb as Patients Service DB
    participant AthenaSvc as Athena Service
    participant Station as Station

    rect rgba(255, 0, 255, .05)
      note right of Client: List Account Patients

      Client->>AccountsSvc: Request account patient info by account ID
      AccountsSvc->>AccountsSvcDB: Read account patients info
      loop For each account patient mapping
          AccountsSvc->>PatientsSvc: Request patient info for each account patient
          alt Patient is unverified
              PatientsSvc->>PatientsSvcDb: Read unverified patient info
          else Patient is verified
              PatientsSvc->>Station: Request patient info
              Station->>PatientsSvc: Return patient info
              PatientsSvc->>AthenaSvc: Request patient info
              AthenaSvc->>PatientsSvc: Return patient info
          end
      end

      AccountsSvc->>Client: Respond with account patients
    end

    rect rgba(0, 255, 255, .05)
        note right of Client: Remove Account Patient by ID
        Client->>AccountsSvc: Delete account patient info by account patient ID
        AccountsSvc->>AccountsSvcDB: Read account patients info
        alt Patient is unverified
            AccountsSvc->>AccountsSvcDB: Soft-delete account patient mapping
            break If error soft-deleting
                AccountsSvc->>Client: Return error
            end

            AccountsSvc->>PatientsSvc: Soft-delete unverified patient info
            PatientsSvc->>AccountsSvc: Respond to delete request
        else Patient is verified
            AccountsSvc->>AccountsSvcDB: Soft-delete account patient mapping
        end

        AccountsSvc->>Client: Respond with success
    end

    rect rgba(255, 125, 0, .05)
        note right of Client: Create Unverified Account Patient
        Client->>AccountsSvc: Request to create unverified account patient
        AccountsSvc->>PatientsSvc: Request to create unverified patient
        PatientsSvc->>PatientSvcDb: Save unverified info
        PatientsSvc->>AccountsSvc: Respond to create request
        break If error creating
            AccountsSvc->>Client: Return error
        end

        AccountsSvc->>AccountsSvcDB: Create account patient mapping
        AccountsSvc->>Client: Respond with success
    end

    rect rgba(255, 0, 255, .05)
        note right of Client: Update Unverified Account Patient
        Client->>AccountsSvc: List account patients (to get IDs)
        Client->>PatientsSvc: Request to update unverified patient
        PatientsSvc->>PatientSvcDb: Update unverified info
        PatientsSvc->>Client: Respond to update request
        break If error updating
            AccountsSvc->>Client: Return error
        end
    end
```
