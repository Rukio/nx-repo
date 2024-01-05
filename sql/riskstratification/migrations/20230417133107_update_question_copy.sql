-- +goose Up
-- +goose StatementBegin
UPDATE
    time_sensitive_questions
SET
    question = 'Do the patient’s symptoms seem MOST likely related to Acute Heart Attack or Acute Coronary Syndrome (ACS)?'
WHERE
    id = ANY('{2e082708-7dc7-4a57-b23c-3a2b19e54866}');

UPDATE
    time_sensitive_questions
SET
    question = 'Does the patient demonstrate symptoms indicating severe respiratory distress?'
WHERE
    id = ANY('{bb43f20b-7ead-4f02-b460-afeb1b3004c8}');

UPDATE
    time_sensitive_questions
SET
    question = 'Do the patient’s symptoms seem MOST likely related to Acute Stroke (Cerebrovascular Accident/CVA)?',
    signs = '{ "signs": [
   "New facial droop -- ask the bystander to assess patient''s smile and eyebrow raise for asymmetry",
   "New loss of vision or true double vision (i.e. seeing 2 overlapping images when staring at an object with both eyes open)",
   "New slurred or garbled speech",
   "New inability to sit upright and is now listing/slumping to the side",
   "New unilateral arm or leg weakness -- ask the patient to reach hands outward, as if they were holding a tray or platter, to see if one arm is drifting downward"
    ]}'
WHERE
    id = ANY('{66262a73-3b43-464f-8a84-6d7c8d105c7d}');

UPDATE
    time_sensitive_questions
SET
    question = 'Do the patient’s symptoms indicate the presence of significant, life-threatening bleeding?',
    signs = '{ "signs": [
   "Heavy or persistent bleeding with anticoagulant use",
   "Passage of large amounts of blood in the stool, including blood clots or dark, maroon colored or black, tarry stools",
   "Coffee-ground emesis or significant amounts (i.e. more than specks or streaks) of bright red blood with vomiting",
   "Severe epistaxis (nosebleed) that will not slow with gentle pressure",
   "Deep laceration or wound with pulsating/spurting blood that cannot be controlled with gentle pressure",
   "Heavy vaginal bleeding"
    ]}'
WHERE
    id = ANY('{9fbf793b-2d30-4cd1-bbd7-3eaa1eeffa9b}');

UPDATE
    time_sensitive_questions
SET
    question = 'Do the patient’s symptoms seem MOST likely related to sepsis or severe, life-threatening infection?'
WHERE
    id = ANY('{508f5aa5-f52a-40c7-b75a-d3633b50a82d}');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    time_sensitive_questions
SET
    question = 'Does the patient have any complaints related to Acute Coronary Syndrome (ACS)?'
WHERE
    id = ANY('{2e082708-7dc7-4a57-b23c-3a2b19e54866}');

UPDATE
    time_sensitive_questions
SET
    question = 'Is the patient demonstrating evidence of severe respiratory distress?'
WHERE
    id = ANY('{bb43f20b-7ead-4f02-b460-afeb1b3004c8}');

UPDATE
    time_sensitive_questions
SET
    question = 'Does the patient have evidence of an acute stroke/Cerebrovascular Accident (CVA)?',
    signs = '{ "signs": [
   "New facial droop -- ask the bystander to assess patient''s smile and eyebrow raise for asymmetry",
   "New loss of vision or true double vision (i.e. seeing 2 overlapping images when staring at an object with both eyes open)",
   "New slurred or garbled speech",
   "New inability to sit upright and is now listing/slumping to the side",
   "New unilateral arm or leg weakness -- ask the patient to reach hands outward, as if they were holding 2 plates, to see if one arm is drifting downward"
    ]}'
WHERE
    id = ANY('{66262a73-3b43-464f-8a84-6d7c8d105c7d}');

UPDATE
    time_sensitive_questions
SET
    question = 'Does the patient have an obvious source of significant, persistent bleeding?',
    signs = '{ "signs": [
   "Heavy or persistent bleeding with anticoagulant use",
   "Bright red blood per rectum",
   "Black, tarry stools and low blood pressure/tachycardia",
   "Coffee-ground emesis or bright red blood with vomiting",
   "Severe epistaxis (nosebleed) that will not slow with gentle pressure",
   "Deep laceration or wound with pulsating/spurting blood that cannot be controlled with gentle pressure",
   "Heavy vaginal bleeding"
    ]}'
WHERE
    id = ANY('{9fbf793b-2d30-4cd1-bbd7-3eaa1eeffa9b}');

UPDATE
    time_sensitive_questions
SET
    question = 'Does the patient have signs of possible sepsis?'
WHERE
    id = ANY('{508f5aa5-f52a-40c7-b75a-d3633b50a82d}');

-- +goose StatementEnd
