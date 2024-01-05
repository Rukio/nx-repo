-- name: AddNewPrediction :one
INSERT INTO
    ml_predictions(
        feature_hash,
        prediction,
        care_request_id,
        model_version
    )
VALUES
    ($1, $2, $3, $4) ON CONFLICT (feature_hash) DO NOTHING RETURNING *;

-- name: LookupPrediction :one
SELECT
    *
FROM
    ml_predictions
WHERE
    feature_hash = $1;

-- name: UpdateLastQueried :one
UPDATE
    ml_predictions
SET
    last_queried_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;
