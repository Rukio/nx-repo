-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    care_request_partner_backfills
ADD
    COLUMN error_description TEXT;

COMMENT ON COLUMN care_request_partner_backfills.error_description IS 'Error description if the backfill failed';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    care_request_partner_backfills DROP COLUMN error_description;

-- +goose StatementEnd
