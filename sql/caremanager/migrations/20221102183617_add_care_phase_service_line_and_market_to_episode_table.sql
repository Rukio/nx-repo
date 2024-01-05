-- +goose Up
-- +goose StatementBegin
INSERT INTO
    care_phases ("id", "name", "is_active")
VALUES
    (1, 'Pending', FALSE),
    (2, 'High Acuity', TRUE),
    (3, 'Transition', TRUE),
    (4, 'Discharged', FALSE),
    (5, 'Closed', FALSE),
    (6, 'Active', TRUE);

INSERT INTO
    service_lines ("id", "name", "short_name")
VALUES
    (1, 'Advanced Care', 'Advanced'),
    (2, 'Bridge Care', 'Bridge'),
    (3, 'Bridge Care Plus', 'Bridge Plus'),
    (4, 'Extended Care', 'Extended');

ALTER TABLE
    task_templates DROP COLUMN "care_phase_id",
    DROP COLUMN "service_line_id";

ALTER TABLE
    task_templates
ADD
    COLUMN "care_phase_id" BIGINT,
ADD
    COLUMN "service_line_id" BIGINT NOT NULL DEFAULT 1,
ADD
    FOREIGN KEY ("care_phase_id") REFERENCES "public"."care_phases"("id"),
ADD
    FOREIGN KEY ("service_line_id") REFERENCES "public"."service_lines"("id");

ALTER TABLE
    episodes
ADD
    COLUMN "care_phase_id" BIGINT NOT NULL DEFAULT 6,
ADD
    COLUMN "service_line_id" BIGINT NOT NULL DEFAULT 1,
ADD
    -- The default here is Denver
    COLUMN "market_id" BIGINT NOT NULL DEFAULT 159,
ADD
    FOREIGN KEY ("care_phase_id") REFERENCES "public"."care_phases"("id"),
ADD
    FOREIGN KEY ("service_line_id") REFERENCES "public"."service_lines"("id");

-- The defaults were only used to update the already existing episodes, that is why we drop them here
ALTER TABLE
    task_templates
ALTER COLUMN
    "service_line_id" DROP DEFAULT;

ALTER TABLE
    episodes
ALTER COLUMN
    "care_phase_id" DROP DEFAULT,
ALTER COLUMN
    "service_line_id" DROP DEFAULT,
ALTER COLUMN
    "market_id" DROP DEFAULT;

COMMENT ON COLUMN task_templates.care_phase_id IS 'The Care Phase associated with this Episode';

COMMENT ON COLUMN task_templates.service_line_id IS 'The Service Line associated with this Episode';

COMMENT ON COLUMN episodes.care_phase_id IS 'The Care Phase associated with this Episode';

COMMENT ON COLUMN episodes.service_line_id IS 'The Service Line associated with this Episode';

COMMENT ON COLUMN episodes.market_id IS 'The Market associated with this Episode';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    "public"."task_templates" DROP COLUMN "care_phase_id",
    DROP COLUMN "service_line_id";

ALTER TABLE
    "public"."episodes" DROP COLUMN "care_phase_id",
    DROP COLUMN "service_line_id",
    DROP COLUMN "market_id";

-- Deleting the rows in case this migration runs many times, that way the rows don't get duplicated
DELETE FROM
    care_phases
WHERE
    id IN (1, 2, 3, 4, 5, 6);

DELETE FROM
    service_lines
WHERE
    id IN (1, 2, 3, 4);

-- +goose StatementEnd
