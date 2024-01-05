-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    episodes
ADD
    "is_waiver" BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN episodes.is_waiver IS 'Has a partnership with a health care system under CMS''s (https://www.cms.gov/) Acute Hospital Care at Home Individual Waiver.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    episodes DROP COLUMN "is_waiver";

-- +goose StatementEnd
