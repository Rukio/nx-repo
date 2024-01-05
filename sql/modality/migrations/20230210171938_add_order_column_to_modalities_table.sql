-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    "modalities"
ADD
    COLUMN "display_order" INT;

COMMENT ON COLUMN modalities.display_order IS 'Order of display of modalities on frontend clients';

UPDATE
    "modalities"
SET
    "display_order" = 1
WHERE
    modality_type = 'in_person';

UPDATE
    "modalities"
SET
    "display_order" = 2
WHERE
    modality_type = 'telepresentation';

UPDATE
    "modalities"
SET
    "display_order" = 3
WHERE
    modality_type = 'virtual';

ALTER TABLE
    "modalities"
ALTER COLUMN
    display_order
SET
    NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    "modalities" DROP COLUMN "display_order";

-- +goose StatementEnd
