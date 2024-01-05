package main

import (
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestAccountProtoFromSQL(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	id1 := baseID + 1
	nowTimestamp := protoconv.TimeToProtoTimestamp(&now)
	nowConsistencyToken, _ := protoconv.TimestampToBytes(nowTimestamp)

	tcs := []struct {
		name  string
		input *patientaccountssql.Account

		want                 *patientaccountspb.Account
		wantConsistencyToken ConsistencyToken
		wantErrText          *string
	}{
		{
			name: "success - base case",
			input: &patientaccountssql.Account{
				ID:          id1,
				Auth0ID:     strconv.FormatInt(id1-1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString("given"),
				FamilyName:  sqltypes.ToValidNullString("family"),
				PhoneNumber: sqltypes.ToValidNullString("3035551234"),
				UpdatedAt:   now,
			},

			want: &patientaccountspb.Account{
				AccountId:  *proto.Int64(id1),
				Email:      testEmail(id1),
				GivenName:  proto.String("given"),
				FamilyName: proto.String("family"),
				Number: &common.PhoneNumber{
					PhoneNumber: proto.String("(303) 555-1234"),
					CountryCode: proto.Int32(1),
				},
				UpdatedAt: nowTimestamp,
			},
			wantConsistencyToken: nowConsistencyToken,
		},
		{
			name: "success - blank given name",
			input: &patientaccountssql.Account{
				ID:          id1,
				Auth0ID:     strconv.FormatInt(id1-1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToNullString(nil),
				FamilyName:  sqltypes.ToValidNullString("family"),
				PhoneNumber: sqltypes.ToNullString(nil),
				UpdatedAt:   now,
			},

			want: &patientaccountspb.Account{
				AccountId:  *proto.Int64(id1),
				Email:      testEmail(id1),
				FamilyName: proto.String("family"),
				UpdatedAt:  nowTimestamp,
			},
			wantConsistencyToken: nowConsistencyToken,
		},
		{
			name: "success - blank family name",
			input: &patientaccountssql.Account{
				ID:          id1,
				Auth0ID:     strconv.FormatInt(id1-1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString("given"),
				FamilyName:  sqltypes.ToNullString(nil),
				PhoneNumber: sqltypes.ToNullString(nil),
				UpdatedAt:   now,
			},

			want: &patientaccountspb.Account{
				AccountId: *proto.Int64(id1),
				Email:     testEmail(id1),
				GivenName: proto.String("given"),
				UpdatedAt: nowTimestamp,
			},
			wantConsistencyToken: nowConsistencyToken,
		},
		{
			name:  "success - nil account",
			input: nil,

			want:                 nil,
			wantConsistencyToken: nil,
		},
		{
			name: "error - invalid phone",
			input: &patientaccountssql.Account{
				ID:          id1,
				Auth0ID:     strconv.FormatInt(id1-1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString("given"),
				FamilyName:  sqltypes.ToValidNullString("family"),
				PhoneNumber: sqltypes.ToValidNullString("-1"),
			},

			wantErrText: &errPhoneNumberParseText,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got, gotConsistencyToken, err := accountProtoFromSQL(tc.input)
			if tc.wantErrText != nil {
				testutils.MustMatch(t, strings.Contains(err.Error(), *tc.wantErrText), true, "unexpected error text")
			}
			mustMatchAccount(t, tc.want, got)
			testutils.MustMatch(t, tc.wantConsistencyToken, gotConsistencyToken)
		})
	}
}

func TestAddressProtoFromSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *patientaccountssql.Address

		want *patientaccountspb.AccountAddress
	}{
		{
			name: "success - base case",
			input: &patientaccountssql.Address{
				ID:              1,
				AccountID:       2,
				AddressLineOne:  sqltypes.ToValidNullString("line 1"),
				AddressLineTwo:  sqltypes.ToValidNullString("line 2"),
				City:            sqltypes.ToValidNullString("city"),
				StateCode:       sqltypes.ToValidNullString("state"),
				Zipcode:         sqltypes.ToValidNullString("zip"),
				LocationDetails: sqltypes.ToValidNullString("gate code"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_CLINIC],
			},

			want: &patientaccountspb.AccountAddress{
				Id:        1,
				AccountId: 2,
				Address: &common.Address{
					AddressLineOne: proto.String("line 1"),
					AddressLineTwo: proto.String("line 2"),
					City:           proto.String("city"),
					State:          proto.String("state"),
					ZipCode:        proto.String("zip"),
				},
				LocationDetails: proto.String("gate code"),
				Location: &common.Location{
					LatitudeE6:  37422410,
					LongitudeE6: -122084168,
				},
				FacilityType: patientaccountspb.FacilityType_FACILITY_TYPE_CLINIC.Enum(),
			},
		},
		{
			name: "success - nil fields",
			input: &patientaccountssql.Address{
				ID:              1,
				AccountID:       2,
				AddressLineOne:  sqltypes.ToNullString(nil),
				AddressLineTwo:  sqltypes.ToNullString(nil),
				City:            sqltypes.ToNullString(nil),
				StateCode:       sqltypes.ToNullString(nil),
				Zipcode:         sqltypes.ToNullString(nil),
				LocationDetails: sqltypes.ToNullString(nil),
				LatitudeE6:      sqltypes.ToNullInt32(nil),
				LongitudeE6:     sqltypes.ToNullInt32(nil),
			},

			want: &patientaccountspb.AccountAddress{
				Id:        1,
				AccountId: 2,
				Address: &common.Address{
					AddressLineOne: nil,
					AddressLineTwo: nil,
					City:           nil,
					State:          nil,
					ZipCode:        nil,
				},
				Location:        nil,
				LocationDetails: nil,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_UNSPECIFIED.Enum(),
			},
		},
		{
			name:  "success - nil address",
			input: nil,

			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got, _, _ := accountAddressProtoFromSQL(tc.input)
			mustMatchAccount(t, tc.want, got)
		})
	}
}

func TestAccountPatientProtoFromSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *patientaccountssql.AccountPatientLink

		wantErr bool
		want    *patientaccountspb.AccountPatientLink
	}{
		{
			name: "success - base case",
			input: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			want: &patientaccountspb.AccountPatientLink{
				Id:          1,
				AccountId:   2,
				AccessLevel: patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},
		},
		{
			name:  "success - nil account patient link",
			input: nil,

			want: nil,
		},
		{
			name: "error - invalid access level ID",
			input: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				AccessLevelID:            -24,
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			wantErr: true,
		},
		{
			name: "error - invalid consenting relationship ID",
			input: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: -54,
			},

			wantErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got, _, gotErr := accountPatientProtoFromSQL(tc.input)
			mustMatchAccount(t, tc.wantErr, gotErr != nil)
			mustMatchAccount(t, tc.want, got)
		})
	}
}
