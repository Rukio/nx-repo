-- +goose Up
-- +goose StatementBegin
-- Intentionally irreversible, rolling back the above actions would break application code due to reliance on SQLC generated code for enums, must be migrated forward
CREATE TABLE IF NOT EXISTS consenting_relationships(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE consenting_relationships IS 'Types of consenting relationships between an account holder and a patient';

COMMENT ON COLUMN consenting_relationships.short_name IS 'Short name of the consenting relationship';

COMMENT ON COLUMN consenting_relationships.description IS 'Description of the consenting relationship';

CREATE UNIQUE INDEX IF NOT EXISTS consenting_relationships_short_name_idx ON consenting_relationships(short_name);

COMMENT ON INDEX consenting_relationships_short_name_idx IS 'Lookup index for consenting relationships';

INSERT INTO
    consenting_relationships(id, short_name, description)
VALUES
    (1, 'self', 'The account holder is the patient'),
    (
        2,
        'family-friend',
        'The account holder is a family member or friend'
    ),
    (
        3,
        'clinician-organization',
        'The account holder is a clinician or organization'
    ),
    (4, 'other', 'None of the other options') ON CONFLICT DO NOTHING;

-- Default to 4 (other) if there are already rows in the table
ALTER TABLE
    account_patient_links
ADD
    COLUMN consenting_relationship_id BIGINT NOT NULL DEFAULT 4,
ADD
    CONSTRAINT fk_account_patient_links_consenting_relationships FOREIGN KEY (consenting_relationship_id) REFERENCES consenting_relationships (id);

COMMENT ON COLUMN account_patient_links.consenting_relationship_id IS 'consenting relationship';

ALTER TABLE
    account_patient_links DROP COLUMN consenting_relationship;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- Intentionally irreversible, rolling back the above actions would break application code due to reliance on SQLC generated code for enums, must be migrated forward
-- +goose StatementEnd
