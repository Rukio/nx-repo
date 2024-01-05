-- name: AddFilesResultCodes :one
INSERT INTO
    files_result_codes (file_id, result_code_id, fields, error_description)
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: AddFilesResultCodesWithOccurrences :one
INSERT INTO
    files_result_codes(
        file_id,
        result_code_id,
        fields,
        number_of_occurrences,
        first_occurrence
    )
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: GetFileResultCodesWithCodeDetailsByFileID :many
SELECT
    frc.number_of_occurrences,
    frc.first_occurrence,
    frc.fields,
    frc.error_description,
    rc.code AS result_code,
    rc.code_description,
    rc.code_level
FROM
    files_result_codes frc
    JOIN result_codes rc ON frc.result_code_id = rc.id
WHERE
    frc.file_id = $1;
