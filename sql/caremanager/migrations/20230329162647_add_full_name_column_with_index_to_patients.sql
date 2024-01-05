-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    "public"."patients"
ADD
    COLUMN "full_name" TEXT GENERATED ALWAYS AS (
        TRIM(
            TRIM(
                first_name || ' ' || CASE
                    WHEN middle_name IS NULL THEN ''
                    ELSE middle_name
                END
            ) || ' ' || last_name
        )
    ) STORED;

CREATE INDEX "patients_full_name_idx" ON "public"."patients" USING GIN ("full_name" "gin_trgm_ops");

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX public."patients_full_name_idx";

ALTER TABLE
    "public"."patients" DROP COLUMN "full_name";

-- +goose StatementEnd
