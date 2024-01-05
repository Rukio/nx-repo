package pophealthdb

import (
	"testing"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestFileStatusToEnum(t *testing.T) {
	tests := []struct {
		name       string
		fileStatus pophealthpb.PopHealthFile_FileStatus

		expectedResp pophealthsql.FileStatus
	}{
		{
			name:         "happy path converting new status to short",
			fileStatus:   pophealthpb.PopHealthFile_FILE_STATUS_NEW,
			expectedResp: pophealthsql.FileStatusNew,
		},
		{
			name:         "happy path converting failed status to short",
			fileStatus:   pophealthpb.PopHealthFile_FILE_STATUS_FAILED,
			expectedResp: pophealthsql.FileStatusFailed,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp := FileStatusToEnum[test.fileStatus]

			testutils.MustMatch(t, test.expectedResp, resp, "short name conversion don't match")
		})
	}
}
