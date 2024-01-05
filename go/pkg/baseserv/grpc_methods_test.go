package baseserv

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestGrpcFullMethodStringFromProtoQualifiedName(t *testing.T) {
	tcs := []struct {
		name       string
		methodName string

		want string
	}{
		{
			name:       "works",
			methodName: "service.MyService.SomeMethod",

			want: "/service.MyService/SomeMethod",
		},
		{
			name:       "if unable to parse, return the same received value",
			methodName: "SomeMethod",

			want: "SomeMethod",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := GrpcFullMethodStringFromProtoQualifiedName(tc.methodName)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}
