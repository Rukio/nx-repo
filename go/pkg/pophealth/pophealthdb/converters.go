package pophealthdb

import (
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
)

var (
	EnumToFileStatus = map[pophealthsql.FileStatus]pophealthpb.PopHealthFile_FileStatus{
		pophealthsql.FileStatusUnspecified: pophealthpb.PopHealthFile_FILE_STATUS_UNSPECIFIED,
		pophealthsql.FileStatusNew:         pophealthpb.PopHealthFile_FILE_STATUS_NEW,
		pophealthsql.FileStatusPreprocess:  pophealthpb.PopHealthFile_FILE_STATUS_PREPROCESS,
		pophealthsql.FileStatusWaiting:     pophealthpb.PopHealthFile_FILE_STATUS_WAITING,
		pophealthsql.FileStatusInvalid:     pophealthpb.PopHealthFile_FILE_STATUS_INVALID,
		pophealthsql.FileStatusFailed:      pophealthpb.PopHealthFile_FILE_STATUS_FAILED,
		pophealthsql.FileStatusProcessing:  pophealthpb.PopHealthFile_FILE_STATUS_PROCESSING,
		pophealthsql.FileStatusProcessed:   pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
	}

	FileStatusToEnum = func() map[pophealthpb.PopHealthFile_FileStatus]pophealthsql.FileStatus {
		res := make(map[pophealthpb.PopHealthFile_FileStatus]pophealthsql.FileStatus, len(EnumToFileStatus))
		for k, v := range EnumToFileStatus {
			res[v] = k
		}
		return res
	}()
)
