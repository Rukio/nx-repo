package main

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPatientConverter(t *testing.T) {
	id := "1"
	firstName := "John"
	lastName := "Doe"
	sexMale := common.Sex_SEX_MALE
	sexFemale := common.Sex_SEX_FEMALE
	otherSex := common.Sex_SEX_OTHER
	unspecifiedSex := common.Sex_SEX_UNSPECIFIED
	dateOfBirth := common.Date{Year: 1939, Month: 2, Day: 1}
	dateOfBirthExpected := "1939-02-01T00:00:00Z"
	tytoSexMale := "M"
	tytoSexFemale := "F"
	testCases := []struct {
		Desc           string
		PatientRequest *tytocarepb.CreatePatientRequest
		Want           *TytoCareCreatePatientRequest
		HasErr         bool
	}{
		{
			Desc: "success - male patient is converted successfully",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sexMale,
			},

			Want: &TytoCareCreatePatientRequest{
				Identifier:  &id,
				FirstName:   &firstName,
				LastName:    &lastName,
				DateOfBirth: &dateOfBirthExpected,
				Sex:         &tytoSexMale,
			},
			HasErr: false,
		},
		{
			Desc: "success - female patient is converted successfully",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sexFemale,
			},

			Want: &TytoCareCreatePatientRequest{
				Identifier:  &id,
				FirstName:   &firstName,
				LastName:    &lastName,
				DateOfBirth: &dateOfBirthExpected,
				Sex:         &tytoSexFemale,
			},
			HasErr: false,
		},
		{
			Desc:           "error - no patient info",
			PatientRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - no patient id",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          "",
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sexMale,
			},

			HasErr: true,
		},
		{
			Desc: "error - no patient first name",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   "",
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sexMale,
			},

			HasErr: true,
		},
		{
			Desc: "error - no patient last name",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    "",
				DateOfBirth: &dateOfBirth,
				Sex:         sexMale,
			},

			HasErr: true,
		},
		{
			Desc: "error - wrong date of birth",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: nil,
				Sex:         sexMale,
			},

			HasErr: true,
		},
		{
			Desc: "error - unspecified sex",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         unspecifiedSex,
			},

			HasErr: true,
		},
		{
			Desc: "error - other sex",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         otherSex,
			},

			HasErr: true,
		},
		{
			Desc: "error - nil sex",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         unspecifiedSex,
			},

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCarePatient, err := ProtoToTytoCarePatient(tc.PatientRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("ProtoToTytoCarePatient hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCarePatient != nil {
				testutils.MustMatch(t, tytoCarePatient, tc.Want, "patients don't match")
			}
		})
	}
}
