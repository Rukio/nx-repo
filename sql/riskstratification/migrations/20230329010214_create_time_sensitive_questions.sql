-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE time_sensitive_survey_versions(
    id uuid DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

COMMENT ON TABLE time_sensitive_survey_versions IS 'Stores survey versions for historical data purposes';

COMMENT ON COLUMN time_sensitive_survey_versions.created_at IS 'Point in time when the record was created';

INSERT INTO
    time_sensitive_survey_versions(id)
VALUES
    ('5a746af6-85fe-4123-8e75-5b09534e2430');

CREATE TABLE time_sensitive_questions(
    id uuid DEFAULT uuid_generate_v4(),
    survey_version_id uuid NOT NULL,
    question TEXT NOT NULL,
    signs jsonb DEFAULT '{}' :: jsonb NOT NULL,
    display_order SMALLINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("survey_version_id") REFERENCES time_sensitive_survey_versions("id")
);

COMMENT ON TABLE time_sensitive_questions IS 'Stores time sensitive questions asked during screening';

COMMENT ON COLUMN time_sensitive_questions.survey_version_id IS 'UUID v4 ID of the Survey';

COMMENT ON COLUMN time_sensitive_questions.question IS 'Question text';

COMMENT ON COLUMN time_sensitive_questions.signs IS 'jsonb of signs that indicate a question should be answered with Yes';

COMMENT ON COLUMN time_sensitive_questions.display_order IS 'Ordering of the question';

COMMENT ON COLUMN time_sensitive_questions.created_at IS 'Point in time when the record was created';

COMMENT ON COLUMN time_sensitive_questions.updated_at IS 'Point in time when the record was updated';

INSERT INTO
    time_sensitive_questions(
        id,
        survey_version_id,
        question,
        display_order,
        signs
    )
VALUES
    (
        '2e082708-7dc7-4a57-b23c-3a2b19e54866',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have any complaints related to Acute Coronary Syndrome (ACS)?',
        1,
        '{ "signs": [
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
            "Family history (parent or sibling with heart attack before the age of 65 years"
        ]
    ]}'
    ),
    (
        'bb43f20b-7ead-4f02-b460-afeb1b3004c8',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Is the patient demonstrating evidence of severe respiratory distress?',
        2,
        '{ "signs": [
        "Gasping, panting, grunting, unable to communicate clearly",
        "Only able to speak 2-3 words at a time or stopping mid-sentence to take a breath",
        "Is the patient hypoxic, with an oxygen level <90%"
    ]}'
    ),
    (
        '66262a73-3b43-464f-8a84-6d7c8d105c7d',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have evidence of an acute stroke/Cerebrovascular Accident (CVA)?',
        3,
        '{ "signs": [
   "New facial droop -- ask the bystander to assess patient''s smile and eyebrow raise for asymmetry",
   "New loss of vision or true double vision (i.e. seeing 2 overlapping images when staring at an object with both eyes open)",
   "New slurred or garbled speech",
   "New inability to sit upright and is now listing/slumping to the side",
   "New unilateral arm or leg weakness -- ask the patient to reach hands outward, as if they were holding 2 plates, to see if one arm is drifting downward"
    ]}'
    ),
    (
        '11e6b3d8-f2bb-4db5-a3ea-9a38f09d7174',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Is the patient unconscious or difficult to arouse to voice or with gentle stimulation (gentle touch)?',
        4,
        '{}'
    ),
    (
        '9fbf793b-2d30-4cd1-bbd7-3eaa1eeffa9b',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have an obvious source of significant, persistent bleeding?',
        5,
        '{ "signs": [
   "Heavy or persistent bleeding with anticoagulant use",
   "Bright red blood per rectum",
   "Black, tarry stools and low blood pressure/tachycardia",
   "Coffee-ground emesis or bright red blood with vomiting",
   "Severe epistaxis (nosebleed) that will not slow with gentle pressure",
   "Deep laceration or wound with pulsating/spurting blood that cannot be controlled with gentle pressure",
   "Heavy vaginal bleeding"
    ]}'
    ),
    (
        '79ed69e6-a4c6-4b93-9492-88f4d315ea1d',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have symptoms of hypotension/hemorrhagic shock from bleeding?',
        6,
        '{ "signs": [
   "Syncope (fainting)",
   "Orthostatic dizziness (lightheadedness and near fainting with standing)",
   "Pale or mottled skin",
   "Hypotension (low blood pressure) with systolic <90 mmHg"
    ]}'
    ),
    (
        '508f5aa5-f52a-40c7-b75a-d3633b50a82d',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have signs of possible sepsis?',
        7,
        '{ "signs": [
   "High fever (+) or known/suspected infection AND",
   [
      "Hypotension (low blood pressure) with systolic <90 mmHg, OR",
      "New altered level of consciousness (hard to awaken) or altered mental status",
      "Profound weakness, as evidenced by new inability to sit upright or stand unaccompanied",
      "True lethargy, manifest by unconscious patient or patient that is difficult to arouse to voice or with gentle stimulation (gentle touch)"
   ]
    ]}'
    ),
    (
        '0de00b81-7a92-4b8a-ac61-d8fb248a52f1',
        '5a746af6-85fe-4123-8e75-5b09534e2430',
        'Does the patient have symptoms of testicular torsion?',
        8,
        '{ "signs": [
   "Unilateral, severe testicular pain",
   "Pain onset within the last 8 hours (not several days)",
   "Nausea/vomiting"
    ]}'
    );

CREATE TABLE time_sensitive_screenings(
    id bigserial PRIMARY KEY,
    care_request_id BIGINT NOT NULL,
    escalated BOOLEAN NOT NULL,
    escalated_question_id uuid NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("escalated_question_id") REFERENCES time_sensitive_questions("id")
);

COMMENT ON TABLE time_sensitive_screenings IS 'Time sensitive screening metadata for a given care request';

COMMENT ON COLUMN time_sensitive_screenings.care_request_id IS 'Care request being screened';

COMMENT ON COLUMN time_sensitive_screenings.escalated IS 'Escalation result for this time sensitive screening';

COMMENT ON COLUMN time_sensitive_screenings.escalated_question_id IS 'The time sensitive question that triggered escalation';

COMMENT ON COLUMN time_sensitive_screenings.created_at IS 'Point in time when the record was created';

COMMENT ON COLUMN time_sensitive_screenings.updated_at IS 'Point in time when the record was updated';

CREATE UNIQUE INDEX time_sensitive_screenings_care_request_idx ON time_sensitive_screenings(care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS time_sensitive_questions CASCADE;

DROP TABLE time_sensitive_screenings;

DROP TABLE time_sensitive_survey_versions;

-- +goose StatementEnd
