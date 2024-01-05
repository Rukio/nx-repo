package main

import (
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestToUnverifiedPatientProto(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	testDateProto := timestamppb.New(testDate)

	tcs := []struct {
		Desc  string
		Input *patientssql.UnverifiedPatient

		Want *patientspb.UnverifiedPatient
	}{
		{
			Desc: "Base case",
			Input: &patientssql.UnverifiedPatient{
				ID:                    1,
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           testDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sqltypes.ToValidNullString("+1-555-555-5555"),
				LegalSex:              patientssql.SexM,
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("text"),
				CreatedAt:             testDate,
				UpdatedAt:             testDate,
				PatientID:             sqltypes.ToValidNullInt64(1),
			},

			Want: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(1),
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("John"),
				FamilyName: proto.String("Doe"),
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: commonpb.BirthSex_BIRTH_SEX_MALE,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt: testDateProto,
				UpdatedAt: testDateProto,
				PatientId: proto.Int64(1),
			},
		},
		{
			Desc: "Only required fields",
			Input: &patientssql.UnverifiedPatient{
				ID:          1,
				DateOfBirth: testDate,
				GivenName:   "Jane",
				FamilyName:  "Doe",
				LegalSex:    patientssql.SexF,
				CreatedAt:   testDate,
				UpdatedAt:   testDate,
			},

			Want: &patientspb.UnverifiedPatient{
				Id: 1,
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   commonpb.Sex_SEX_FEMALE,
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
			},
		},
		{
			Desc: "Only required fields with unspecified sex",
			Input: &patientssql.UnverifiedPatient{
				ID:          1,
				DateOfBirth: testDate,
				GivenName:   "Jane",
				FamilyName:  "Doe",
				CreatedAt:   testDate,
				UpdatedAt:   testDate,
			},

			Want: &patientspb.UnverifiedPatient{
				Id: 1,
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   commonpb.Sex_SEX_UNSPECIFIED,
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := UnverifiedPatientSQLToProto(tc.Input)

			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestToNullSex(t *testing.T) {
	tcs := []struct {
		Description string
		Value       patientssql.Sex

		ExpectedValue patientssql.NullSex
	}{
		{
			Description: "success - male",
			Value:       "m",

			ExpectedValue: patientssql.NullSex{
				Sex:   patientssql.SexM,
				Valid: true,
			},
		},
		{
			Description: "success - female",
			Value:       "f",

			ExpectedValue: patientssql.NullSex{
				Sex:   patientssql.SexF,
				Valid: true,
			},
		},
		{
			Description: "success - unknown",
			Value:       "u",

			ExpectedValue: patientssql.NullSex{
				Sex:   patientssql.SexU,
				Valid: true,
			},
		},
		{
			Description: "failed - unmapped value",
			Value:       "test",

			ExpectedValue: patientssql.NullSex{
				Valid: false,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := ToNullSex(tc.Value)

			testutils.MustMatch(t, tc.ExpectedValue, value)
		})
	}
}

func TestToNullGenderIdentity(t *testing.T) {
	tcs := []struct {
		Description string
		Value       patientssql.GenderIdentity

		ExpectedValue patientssql.NullGenderIdentity
	}{
		{
			Description: "success - male",
			Value:       "m",

			ExpectedValue: patientssql.NullGenderIdentity{
				GenderIdentity: "m",
				Valid:          true,
			},
		},
		{
			Description: "success - female",
			Value:       "f",

			ExpectedValue: patientssql.NullGenderIdentity{
				GenderIdentity: "f",
				Valid:          true,
			},
		},
		{
			Description: "success - unknown",
			Value:       "u",

			ExpectedValue: patientssql.NullGenderIdentity{
				GenderIdentity: "u",
				Valid:          true,
			},
		},
		{
			Description: "success - other",
			Value:       "other",

			ExpectedValue: patientssql.NullGenderIdentity{
				GenderIdentity: "other",
				Valid:          true,
			},
		},
		{
			Description: "failed - unmapped value",
			Value:       "test",

			ExpectedValue: patientssql.NullGenderIdentity{
				Valid: false,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := ToNullGenderIdentity(tc.Value)

			testutils.MustMatch(t, tc.ExpectedValue, value)
		})
	}
}

func TestToUnverifiedPatientSQL(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)

	tcs := []struct {
		Desc  string
		Input *patientspb.UnverifiedPatient

		WantErr bool
		Want    *patientssql.UnverifiedPatient
	}{
		{
			Desc: "Base case",
			Input: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(1),
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("John"),
				FamilyName: proto.String("Doe"),
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: commonpb.BirthSex_BIRTH_SEX_MALE,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
			},

			Want: &patientssql.UnverifiedPatient{
				ID:                    1,
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           testDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sqltypes.ToValidNullString("(555) 555-5555"),
				LegalSex:              patientssql.SexM,
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("text"),
			},
		},
		{
			Desc: "Only required fields",
			Input: &patientspb.UnverifiedPatient{
				Id: 1,
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   commonpb.Sex_SEX_FEMALE,
			},

			Want: &patientssql.UnverifiedPatient{
				ID:          1,
				DateOfBirth: testDate,
				GivenName:   "Jane",
				FamilyName:  "Doe",
				LegalSex:    patientssql.SexF,
			},
		},
		{
			Desc: "Failed to parse mobile phone",
			Input: &patientspb.UnverifiedPatient{
				Id: 1,
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     proto.String("invalid"),
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   commonpb.Sex_SEX_FEMALE,
			},

			WantErr: true,
		},
		{
			Desc: "Only required fields with unspecified sex",
			Input: &patientspb.UnverifiedPatient{
				Id: 1,
				DateOfBirth: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   7,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   commonpb.Sex_SEX_UNSPECIFIED,
			},

			Want: &patientssql.UnverifiedPatient{
				ID:          1,
				DateOfBirth: testDate,
				GivenName:   "Jane",
				FamilyName:  "Doe",
				LegalSex:    "u",
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res, err := ToUnverifiedPatientSQL(tc.Input)
			if (err != nil) != tc.WantErr {
				t.Fatalf("failed, wanted error: %t, got error: %s", tc.WantErr, err)
			}

			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestProtoSexToSQL(t *testing.T) {
	tcs := []struct {
		Description   string
		Value         commonpb.Sex
		ExpectedValue patientssql.Sex
	}{
		{
			Description:   "success - male",
			Value:         commonpb.Sex_SEX_MALE,
			ExpectedValue: patientssql.SexM,
		},
		{
			Description:   "success - female",
			Value:         commonpb.Sex_SEX_FEMALE,
			ExpectedValue: patientssql.SexF,
		},
		{
			Description:   "success - unknown",
			Value:         commonpb.Sex_SEX_UNSPECIFIED,
			ExpectedValue: patientssql.SexU,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := ProtoSexToSQL(tc.Value)

			testutils.MustMatch(t, tc.ExpectedValue, value)
		})
	}
}

func TestProtoGenderIdentityToSQL(t *testing.T) {
	tcs := []struct {
		desc  string
		input commonpb.GenderIdentity_Category

		want patientssql.GenderIdentity
	}{
		{
			desc:  "success - mapped",
			input: commonpb.GenderIdentity_CATEGORY_MALE_TO_FEMALE,

			want: patientssql.GenderIdentityMtf,
		},
		{
			desc:  "success - unmapped",
			input: commonpb.GenderIdentity_Category(-12),

			want: patientssql.GenderIdentityU,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			value := ProtoGenderIdentityCategoryToSQL(tc.input)

			testutils.MustMatch(t, tc.want, value)
		})
	}
}

func TestSQLGenderIdentityToProto(t *testing.T) {
	tcs := []struct {
		desc         string
		category     patientssql.GenderIdentity
		otherDetails *string

		want *commonpb.GenderIdentity
	}{
		{
			desc:     "success - mapped",
			category: patientssql.GenderIdentityFtm,

			want: &commonpb.GenderIdentity{
				Category: commonpb.GenderIdentity_CATEGORY_FEMALE_TO_MALE,
			},
		},
		{
			desc:         "success - with other details",
			category:     patientssql.GenderIdentityOther,
			otherDetails: proto.String("details"),

			want: &commonpb.GenderIdentity{
				Category:     commonpb.GenderIdentity_CATEGORY_OTHER,
				OtherDetails: proto.String("details"),
			},
		},
		{
			desc:     "success - unmapped",
			category: patientssql.GenderIdentity("invalid"),

			want: &commonpb.GenderIdentity{
				Category: commonpb.GenderIdentity_CATEGORY_UNSPECIFIED,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			value := SQLGenderIdentityToProto(tc.category, tc.otherDetails)

			testutils.MustMatch(t, tc.want, value)
		})
	}
}

func TestUnverifiedSQLPatientToAddUnverifiedPatientParams(t *testing.T) {
	exampleDate := time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)

	tcs := []struct {
		Description   string
		Value         *patientssql.UnverifiedPatient
		ExpectedValue *patientssql.AddUnverifiedPatientParams
	}{
		{
			Description: "success - base case",
			Value: &patientssql.UnverifiedPatient{
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           exampleDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sqltypes.ToValidNullString("555-555-4444"),
				LegalSex:              "m",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("test"),
			},

			ExpectedValue: &patientssql.AddUnverifiedPatientParams{
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           exampleDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sqltypes.ToValidNullString("555-555-4444"),
				LegalSex:              "m",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("test"),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := UnverifiedSQLPatientToAddUnverifiedPatientParams(tc.Value)

			testutils.MustMatch(t, tc.ExpectedValue, value)
		})
	}
}
