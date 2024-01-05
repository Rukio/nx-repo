package grpcgateway

import (
	"context"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc/metadata"
)

func TestHTTPResponseModifier(t *testing.T) {
	testCases := []struct {
		Name    string
		Context context.Context

		ExpectedStatusCode int
		ExpectedErrorMsg   string
	}{
		{
			Name: "works",
			Context: runtime.NewServerMetadataContext(
				context.Background(),
				runtime.ServerMetadata{
					HeaderMD: metadata.New(map[string]string{
						"x-http-code": "503",
					})},
			),

			ExpectedStatusCode: 503,
		},
		{
			Name: "does not modify a request without the custom x-http-code header",
			Context: runtime.NewServerMetadataContext(
				context.Background(),
				runtime.ServerMetadata{},
			),

			ExpectedStatusCode: 200,
		},
		{
			Name: "fails to parse invalid status codes",
			Context: runtime.NewServerMetadataContext(
				context.Background(),
				runtime.ServerMetadata{
					HeaderMD: metadata.New(map[string]string{
						"x-http-code": "this-is-not-an-http-code",
					})},
			),

			ExpectedErrorMsg: `strconv.Atoi: parsing "this-is-not-an-http-code": invalid syntax`,
		},
		{
			Name:    "empty context",
			Context: context.Background(),

			ExpectedStatusCode: 200,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			w := httptest.NewRecorder()

			err := HTTPResponseModifier(testCase.Context, w, nil)

			res := w.Result()
			defer res.Body.Close()

			if testCase.ExpectedErrorMsg == "" && err != nil {
				t.Fatal("Unexpected error when modifying the response", err.Error())
			}

			if testCase.ExpectedErrorMsg != "" {
				testutils.MustMatch(t, testCase.ExpectedErrorMsg, err.Error(), "HTTPResponseModifier error does not match test case")
			} else {
				testutils.MustMatch(t, testCase.ExpectedStatusCode, res.StatusCode, "HTTPResponseModifier set an incorrect status code")
			}
		})
	}
}
