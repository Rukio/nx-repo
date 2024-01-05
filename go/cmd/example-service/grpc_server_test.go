package main

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestGetDate(t *testing.T) {
	tcs := []struct {
		Desc  string
		Input *examplepb.GetVersionRequest

		Output   *examplepb.GetVersionResponse
		HasError bool
	}{
		{
			Desc:  "Base case",
			Input: &examplepb.GetVersionRequest{},

			Output: &examplepb.GetVersionResponse{
				Version: proto.String("1"),
			},
		},
		{
			Desc:  "nil request",
			Input: nil,

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{})}
			response, err := s.GetVersion(context.Background(), tc.Input)
			if tc.HasError != (err != nil) {
				t.Fatal(err)
			}
			testutils.MustMatch(t, response, tc.Output, "did not receive expected output")
		})
	}
}
