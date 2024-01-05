package main

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestLogAndReturnErr(t *testing.T) {
	logger := zap.NewNop().Sugar()
	code := codes.Internal
	errorMessage := "test error"
	tests := []struct {
		name   string
		fields []any
		err    error

		wantErr error
	}{
		{
			name:   "no fields with error",
			fields: []any{},
			err:    errInternalTest,

			wantErr: status.Errorf(code, "%s %v", errorMessage, errInternalTest),
		},
		{
			name:   "no fields without error",
			fields: []any{},
			err:    nil,

			wantErr: status.Errorf(code, "%s %v", errorMessage, nil),
		},
		{
			name:   "fields with error",
			fields: []any{"test1", "a", "test2", 5},
			err:    errInternalTest,

			wantErr: status.Errorf(code, "%s %v", errorMessage, errInternalTest),
		},
		{
			name:   "fields without error",
			fields: []any{"test1", "a", "test2", 5},
			err:    nil,

			wantErr: status.Errorf(code, "%s %v", errorMessage, nil),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotErr := LogAndReturnErr(logger, code, errorMessage, test.err, test.fields...)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}
