package main

import (
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"google.golang.org/protobuf/proto"
)

const (
	// see sql/patients/migrations/20230830095906_add_birth_sex_lookup_table.sql`.
	BirthSexIDMale        int64 = 1
	BirthSexIDFemale      int64 = 2
	BirthSexIDUndisclosed int64 = 3
	BirthSexIDUnknown     int64 = 4
)

var (
	BirthSexProtoToBirthSexID = map[commonpb.BirthSex]*int64{
		commonpb.BirthSex_BIRTH_SEX_MALE:        proto.Int64(BirthSexIDMale),
		commonpb.BirthSex_BIRTH_SEX_FEMALE:      proto.Int64(BirthSexIDFemale),
		commonpb.BirthSex_BIRTH_SEX_UNDISCLOSED: proto.Int64(BirthSexIDUndisclosed),
		commonpb.BirthSex_BIRTH_SEX_UNKNOWN:     proto.Int64(BirthSexIDUnknown),
	}

	BirthSexIDToProto = func() map[int64]commonpb.BirthSex {
		res := make(map[int64]commonpb.BirthSex, len(BirthSexProtoToBirthSexID))
		for k, v := range BirthSexProtoToBirthSexID {
			res[*v] = k
		}
		return res
	}()
)
