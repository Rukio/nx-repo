package apistatus

import (
	"fmt"
	"net/http"

	"google.golang.org/grpc/codes"
)

var (
	httpStatusToGRPC = map[int]codes.Code{
		http.StatusOK:                  codes.OK,
		http.StatusNoContent:           codes.OK,
		http.StatusBadRequest:          codes.InvalidArgument,
		http.StatusUnauthorized:        codes.Unauthenticated,
		http.StatusForbidden:           codes.PermissionDenied,
		http.StatusNotFound:            codes.NotFound,
		http.StatusUnprocessableEntity: codes.InvalidArgument,
		http.StatusTooManyRequests:     codes.ResourceExhausted,
		http.StatusInternalServerError: codes.Internal,
		http.StatusNotImplemented:      codes.Unimplemented,
	}
)

func HTTPStatusToGRPC(statusCode int) (codes.Code, error) {
	result, ok := httpStatusToGRPC[statusCode]

	if !ok {
		return codes.Unknown, fmt.Errorf("unknown status code: %d", statusCode)
	}

	return result, nil
}
