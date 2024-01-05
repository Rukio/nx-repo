-- +goose Up
-- +goose StatementBegin
UPDATE
    time_sensitive_questions
SET
    signs = '{ "signs": [
    "Chest pain, pressure or heaviness that persists and has not completely resolved",
    "Chest pain that worsens with exertion or activity",
    "Jaw or neck or back or arm or epigastric pain PLUS any of one the following: nausea/vomiting, diaphoresis or shortness of breath",
    "Note: Symptoms that suggest NON-CARDIAC chest pain include: pain that is sharp lasting seconds or minutes, pain that changes with position (lying flat or sitting upright, or with coughing, deep breathing, or moving the arms or torso)",
    "Note: There is a higher likelihood patient’s symptoms are cardiac if the patient has the following risk factors for coronary artery disease:",
    [
        "History of heart attack",
        "Age >45 years",
        "Smoking",
        "Hypertension",
        "High cholesterol (Hypercholesterolemia)",
        "Diabetes",
        "Family history (parent or sibling with heart attack before the age of 65 years"
    ]
    ]}'
WHERE
    id = '2e082708-7dc7-4a57-b23c-3a2b19e54866';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    time_sensitive_questions
SET
    signs = '{ "signs": [
    "Chest pain/pressure/heaviness",
    "Epigastric pain PLUS nausea/vomiting AND/OR shortness of breath",
    "Jaw/neck/back/arm pain PLUS nausea/vomiting AND/OR shortness of breath",
    "Note: There is a higher likelihood patient’s symptoms are cardiac if the patient has the following risk factors for coronary artery disease:",
    [
        "History of heart attack",
        "Age >45 years",
        "Smoking",
        "Hypertension",
        "High cholesterol (Hypercholesterolemia)",
        "Diabetes",
        "Family history (parent or sibling with heart attack before the age of 65 years"]
    ]}'
WHERE
    id = '2e082708-7dc7-4a57-b23c-3a2b19e54866';

-- +goose StatementEnd
