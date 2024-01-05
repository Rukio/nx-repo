package main

import (
	"context"
	"errors"
	"testing"
	"time"

	"go.uber.org/zap"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

type mockProcessService struct {
	moveFileInExchangeBucketByStatusErr error
}

func (m *mockProcessService) UpdateFileWithInternalResultCode(ctx context.Context, fileID int64, code string) {
}

func (m *mockProcessService) moveFileInExchangeBucketByStatus(ctx context.Context, popHealthFile *pophealthsql.File) (*pophealthsql.File, error) {
	return nil, m.moveFileInExchangeBucketByStatusErr
}

func (m *mockProcessService) processNextWaitingFile(ctx context.Context, templateID int64) {
}

func TestRun(t *testing.T) {
	testError := errors.New("Test")

	tests := []struct {
		name           string
		db             dbFileService
		processService processService

		expectedError error
	}{
		{
			name: "happy path",
			db: &mockDBFileService{
				getExpiredFilesResp: []*pophealthsql.GetExpiredFilesRow{
					{
						ID:   1,
						Name: "Test 1",
					},
					{
						ID:   2,
						Name: "Test 2",
					},
				},
			},
			processService: &mockProcessService{},
			expectedError:  context.DeadlineExceeded,
		},
		{
			name: "happy path with backfill files",
			db: &mockDBFileService{
				getExpiredFilesResp: []*pophealthsql.GetExpiredFilesRow{
					{
						ID:   1,
						Name: "Test 1",
					},
					{
						ID:         2,
						Name:       "Test 2",
						IsBackfill: true,
					},
				},
			},
			processService: &mockProcessService{},
			expectedError:  context.DeadlineExceeded,
		},
		{
			name: "error getting expired files does not exit early",
			db: &mockDBFileService{
				getExpiredFilesErr: testError,
			},
			processService: &mockProcessService{},
			expectedError:  context.DeadlineExceeded,
		},
		{
			name: "error updating file by id",
			db: &mockDBFileService{
				getExpiredFilesResp: []*pophealthsql.GetExpiredFilesRow{
					{
						ID:   1,
						Name: "Test 1",
					},
				},
				errUpdateFileByID: errInternalTest,
			},
			processService: &mockProcessService{},
			expectedError:  context.DeadlineExceeded,
		},
		{
			name: "error moving file",
			db: &mockDBFileService{
				getExpiredFilesResp: []*pophealthsql.GetExpiredFilesRow{
					{
						ID:   1,
						Name: "Test 1",
					},
				},
			},
			processService: &mockProcessService{
				moveFileInExchangeBucketByStatusErr: errInternalTest,
			},
			expectedError: context.DeadlineExceeded,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			const shortDuration = 100 * time.Millisecond

			ctx, cancel := context.WithTimeout(context.Background(), shortDuration)

			defer cancel()

			fileCheckerService := &FileCheckerService{
				db:             test.db,
				processService: test.processService,
				logger:         zap.NewNop().Sugar(),
				influxScope:    &monitoring.NoopScope{},
				sleepDuration:  time.Millisecond * 10,
			}

			err := fileCheckerService.Run(ctx)
			if err == nil {
				t.Fatalf("expected error:  %v, but got nil", test.expectedError)
			}
			if !errors.Is(err, test.expectedError) {
				t.Fatalf("expected error:  %v, but got: %v", test.expectedError, err)
			}
		})
	}
}
