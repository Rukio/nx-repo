package apistatus

import (
	"fmt"
	"net/http"
	"testing"

	"google.golang.org/grpc/codes"
)

func TestHTTPStatusToGRPC(t *testing.T) {
	var (
		invalidHTTPStatus = -1
		tcs               = []struct {
			Desc string

			Input int

			WantCode  codes.Code
			WantError bool
		}{
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusOK),
				Input: http.StatusOK,

				WantCode:  codes.OK,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusNoContent),
				Input: http.StatusNoContent,

				WantCode:  codes.OK,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusBadRequest),
				Input: http.StatusBadRequest,

				WantCode:  codes.InvalidArgument,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusUnauthorized),
				Input: http.StatusUnauthorized,

				WantCode:  codes.Unauthenticated,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusForbidden),
				Input: http.StatusForbidden,

				WantCode:  codes.PermissionDenied,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusNotFound),
				Input: http.StatusNotFound,

				WantCode:  codes.NotFound,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusUnprocessableEntity),
				Input: http.StatusUnprocessableEntity,

				WantCode:  codes.InvalidArgument,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusTooManyRequests),
				Input: http.StatusTooManyRequests,

				WantCode:  codes.ResourceExhausted,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusInternalServerError),
				Input: http.StatusInternalServerError,

				WantCode:  codes.Internal,
				WantError: false,
			},
			{
				Desc:  fmt.Sprintf("Http Status: %d", http.StatusNotImplemented),
				Input: http.StatusNotImplemented,

				WantCode:  codes.Unimplemented,
				WantError: false,
			},
			{
				Desc:  "invalid http status",
				Input: invalidHTTPStatus,

				WantCode:  codes.Unknown,
				WantError: true,
			},
		}
	)

	for _, tc := range tcs {
		result, err := HTTPStatusToGRPC(tc.Input)
		if tc.WantCode != result {
			t.Fatalf("received unexpected status: %+v", tc)
		}
		if (tc.WantError && err == nil) || (!tc.WantError && err != nil) {
			t.Fatalf("received unexpected error: %+v", tc)
		}
	}
}
