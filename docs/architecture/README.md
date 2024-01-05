# Instructions

1. First, run `brew install graphviz`.
2. If you are creating a new `.dot` file, it will need to be added to the `Makefile`.
3. After making modifications to the `.dot` file, navigate to `docs/architecture` and run `make` to compile changes into the `.svg` file.

# Glossary

## Frontend (FE): Web and Mobile apps UIs

- Advanced Care Onboarding - Advanced Care UI
- Manual Optimizer - Used by internal logistics optimizer admins
- Partner Onboarding - External partner UI
- Patient (Companion) - Consumer patient UI
- Provider - Self-service UI for providers to access availability
- Provider App (Rover) - App used in the field by providers while giving care to patients
- Web Onboarding - Consumer UI

## Backend Servers (BE)

- API Proxy: Server used to proxy API calls to other internal Backends

  - Consumer API Proxy: Serve consumer Frontends

    - Consumer-level auditing

  - Admin API Proxy: Serve admin-level servers

    - Stringent access/auditing
    - Restricted permissions

- Auditing: General auditing of all services
- Auth: Authentication and authorization for all services
- Data: Provide canonical data/modification

  - Patient
  - Provider
  - Equipment
  - Partner
  - Chief Complaint
  - Service Line: Enum of Advanced Care etc

- Electronic Health Records (EHR): System for managing health records
- Electronic Health Records Proxy (EHRProxy): Proxy access to EHR system
- Episode: Collection of Visits, for single medical event, related to Revenue Cycle Management
- Logistics: Coordinate/match/schedule providers and patients
- Notification: Infrastructure for handling notifications to clients
- Revenue Cycle Management (RCM): Handles billing lifecycles for rendered episode services
- Risk Assessment: Determine risk of treating patients
- Task: Todo items for providers
- Visit: Single encounter with a patient
- Usage Monitoring: Access/auditing capabilities for API access
