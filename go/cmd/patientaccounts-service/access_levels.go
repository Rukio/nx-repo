package main

import (
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
)

type AccessLevelID int64

const (
	// see sql/patientaccounts/migrations/20230820132828_create_access_levels.sql`.
	AccessLevelIDPrimary    AccessLevelID = 1
	AccessLevelIDPHI        AccessLevelID = 2
	AccessLevelIDUnverified AccessLevelID = 3
)

func (v AccessLevelID) Int64() int64 {
	return int64(v)
}

var (
	AccessLevelProtoToID = map[patientaccountspb.AccountPatientLink_AccessLevel]int64{
		patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY:    AccessLevelIDPrimary.Int64(),
		patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PHI:        AccessLevelIDPHI.Int64(),
		patientaccountspb.AccountPatientLink_ACCESS_LEVEL_UNVERIFIED: AccessLevelIDUnverified.Int64(),
	}

	AccessLevelIDToProto = func() map[int64]patientaccountspb.AccountPatientLink_AccessLevel {
		res := make(map[int64]patientaccountspb.AccountPatientLink_AccessLevel, len(AccessLevelProtoToID))
		for k, v := range AccessLevelProtoToID {
			res[v] = k
		}
		return res
	}()
)
