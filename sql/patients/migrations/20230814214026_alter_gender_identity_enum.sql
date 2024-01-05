-- +goose Up
-- +goose StatementBegin
ALTER TYPE gender_identity
ADD
    VALUE 'undisclosed';

COMMENT ON TYPE gender_identity IS 'm=male, f=female, mtf=male-to-female, ftm=female-to-male, nb=nonbinary, u=unknown, undisclosed=choose not to disclose, and other=other';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- Irreversible, should be migrated forward
-- +goose StatementEnd
