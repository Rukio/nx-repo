# Creating CRs, Episodes and Visits

## Creating a new Advanced Care Request

The following guide describes how to configure Station/Dashboard to allow the creation of Advanced Care Care Requests (CRs) that will end-up creating a new Episode and a Visit in CareManager.

- Setup `caremanager-service`.
- Setup `station`.
- Setup `logistics-service` along with its dependencies (OSRM and Optimizer).
  - See `caremanager-service` README for this.
- Setup `onboarding-api` and `onboarding-web` (check their respective READMEs).
- Setup `modality-service` and `modality-dashboard` (check their respective READMEs).
- Create a new _Care Team Shift_ in Dashboard.
  - Add _Advanced_ in _Eligible Services_.
  - Choose a Market (this is the Market we will use across this guide, we recommend using Las Vegas, Nevada, shortname LAS. This must be consistent with the region you chose for the OSRM in logistics, e.g. choosing LAS market implies that you also chose `nevada` for the OSRM).
  - Choose car (does not matter which one is selected).
  - Add date range.
  - In _Team_ select at least one practitioner with the _advance practice practitioner_ (aka APP).
  - Use that same practitioner to set the _Rendering Provider_.
- Go to `/admin/users` in Dashboard.
  - Double check the practitioner selected as APP in the previous step has the desired Market enabled.
  - Check if the practitioner has a license in the desired Market, if not, add new license.
- Go to `/admin/states` in Dashboard.
  - Click on the state the Market is located in.
  - Click on _Insurance Plans_.
  - Search for _Humana_.
  - Click on the three dots on any of them (it is important to remember which one we configure in this step, since it is the one we use when onboarding the patient). Then click _EDIT Plan_.
  - Make sure the Market you will be using for the CR is listed in the _ACTIVE BILLING CITIES & NOTES_ section.
  - Now go to the _SERVICE LINES_ section and make sure _Advanced Care_ is selected.
  - In the _Advance Care_ options, in _APPOINTMENT TYPE_ make sure the _Same for both new/existing patient_ option is selected, and in the _NEW/EXISTING PATIENT_ the _New Patient_ is selected.
  - Make sure the _SCHEDULING_ _Now_ option is selected.
  - In the _CHANNEL PARTNERS_ section, make sure the _ALL CHANNEL PARTNERS_ is selected.
  - Click _SAVE_.
- Create the Care Request.
  - Input patient basic data.
    - Click on New Care Request or the + button.
    - Fill First Name, Last Name and Phone Number.
    - Fill a Zipcode within the Market you selected when creating the Care Team Shift.
    - Continue filling the form (data not relevant for Caremanager).
    - Click Begin Onboarding.
  - Patient demographics.
    - Either select a patient or create a new one.
    - If a patient is selected skip to _Create Insurance_ step.
    - Click create patient.
    - Fill the patient’s data in the modal. **Note**: Patient MUST be 18 or older to be eligible for Advanced Care.
  - Create insurance
    - Click Insurance.
    - Click Add Insurance.
    - Insurance Provider not relevant for Caremanager but required by Onboarding.
      Fill Member ID.
    - Select any “Humana” Insurance Plan others may not be elegible for Advanced Care.
    - Click Patient on primary insurance holder.
    - Click check elegibility and wait for it to say Unverified (QA).
      Click save.
    - A secondary insurance may be added for testing purposes and should be displayed in CareManager.
  - Symptoms
    - Search and select Syptom "Advanced Care". Others may be selected but may not be eligible for Advanced.Care service line.
    - Click the Advanced Care bubble to select it as the chief complaint.
    - Click Risk Stratification.
    - Click Yes.
    - Click Continue.
  - Schedule the Care Request
    - Click the Schedule button on the left part of the screen.
    - Click Yes for permission to visit you.
    - Click Yes for permission to leave a voicemail (or no works as well).
    - Two different flows to check here:
      - Click yes for an easier flow.
      - Click no:
        - Two different flows to check here:
          - Click yes for an easier flow and fill the first name and last name.
          - Click no and fill first name, last name, relationship and phone number.
        - Click yes on the last consenting to have DH provide care for the patient.
    - Fill the address with an address in the same Market we used for the Care Shift Team and the patient address.
    - City, state and zip code must be automatically filled.
    - Click save address.
    - **IMPORTANT STEP**: Make sure Advanced Care is selected or no Visit will be created in CareManager.
    - Select a Start time and End Time.
    - Click Schedule Visit.

## Creating a new Visit in an existing Episode

This flow will create a new Visit in an existing Episode.

- Click on the three dot menu on an already created Care Request.
  - This Care Request (as known as the _source Care Request_ you be an Advanced Care Request).
- Click on _Duplicate_.
  - This will redirect you to Onboarding (it may take several seconds to so).
  - If you already duplicated a CareRequest but didn't assign it, click on _Assign_.
- Once you are in Onboarding:
  - You will see the same screen used for creating Care Requests, but this time the fields will be prepopulated.
  - Click on _Begin Onboarding_.
  - Click on _Schedule_.
  - Fill the _Start Time_ and _End Time_ fields.
  - Click _Schedule Visit_.
