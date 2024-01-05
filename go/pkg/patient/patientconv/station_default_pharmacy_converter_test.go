package patientconv

import (
	"testing"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

const (
	pharmacyID           = "11840867"
	pharmacyName         = "Walgreens Drug Store #15434"
	pharmacyType         = "RETAIL"
	pharmacyState        = "CO"
	pharmacyCity         = "Denver"
	pharmacyReceiverType = "ERX"
	pharmacyAcceptFax    = "true"
	pharmacyZip          = "802053813"
	pharmacyPhoneNumber  = "3033207847"
	pharmacyAddress1     = "3555 N Colorado Blvd"
	pharmacyFaxNumber    = "3033207823"
)

func TestStationDefaultPharmacyToProto(t *testing.T) {
	tcs := []struct {
		Desc                 string
		InputDefaultPharmacy *patient.StationPharmacy
		WantDefaultPharmacy  *patientspb.Pharmacy
		HasErr               bool
	}{
		{
			Desc:                 "Base case",
			InputDefaultPharmacy: exampleStationDefaultPharmacy(),
			WantDefaultPharmacy:  exampleDefaultPharmacyProto(),
		},
		{
			Desc:   "Nil pharmacy",
			HasErr: true,
		},
		{
			Desc:                 "Empty pharmacy",
			InputDefaultPharmacy: &patient.StationPharmacy{},
			HasErr:               true,
		},
		{
			Desc: "Pharmacy without pharmacy id",
			InputDefaultPharmacy: &patient.StationPharmacy{
				ClinicalProviderName: proto.String(pharmacyName),
				PharmacyType:         proto.String(pharmacyType),
				State:                proto.String(pharmacyState),
				City:                 proto.String(pharmacyCity),
				ReceiverType:         proto.String(pharmacyReceiverType),
				AcceptFax:            proto.String(pharmacyAcceptFax),
				Zip:                  proto.String(pharmacyZip),
				PhoneNumber:          proto.String(pharmacyPhoneNumber),
				Address1:             proto.String(pharmacyAddress1),
				FaxNumber:            proto.String(pharmacyFaxNumber),
			},
			HasErr: true,
		},
		{
			Desc: "Pharmacy with wrong phone number",
			InputDefaultPharmacy: &patient.StationPharmacy{
				ClinicalProviderName: proto.String(pharmacyName),
				PharmacyType:         proto.String(pharmacyType),
				State:                proto.String(pharmacyState),
				City:                 proto.String(pharmacyCity),
				ReceiverType:         proto.String(pharmacyReceiverType),
				AcceptFax:            proto.String(pharmacyAcceptFax),
				Zip:                  proto.String(pharmacyZip),
				PhoneNumber:          proto.String("1"),
				Address1:             proto.String(pharmacyAddress1),
				FaxNumber:            proto.String(pharmacyFaxNumber),
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationDefaultPharmacy, err := StationDefaultPharmacyToProto(tc.InputDefaultPharmacy)
			if tc.HasErr {
				return
			}
			if err != nil {
				t.Errorf("StationDefaultPharmacy to Default Pharmacy proto hit unexpected error %s with test case %+v", err, tc)
			}
			if !proto.Equal(stationDefaultPharmacy, tc.WantDefaultPharmacy) {
				t.Errorf("\ngot %s\nwant %s", stationDefaultPharmacy, tc.WantDefaultPharmacy)
			}
		})
	}
}

func TestPharmacyIDToStationDefaultPharmacyParams(t *testing.T) {
	tcs := []struct {
		Desc                      string
		InputDefaultPharmacyID    string
		WantDefaultPharmacyParams *patient.StationDefaultPharmacyParams
		HasErr                    bool
	}{
		{
			Desc:                      "Base case",
			InputDefaultPharmacyID:    pharmacyID,
			WantDefaultPharmacyParams: exampleStationDefaultPharmacyParams(),
		},
		{
			Desc:                   "Empty pharmacy ID",
			InputDefaultPharmacyID: "",
			HasErr:                 true,
		},
		{
			Desc:   "Nil pharmacy ID",
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationDefaultPharmacyParams, err := PharmacyIDToStationDefaultPharmacyParams(tc.InputDefaultPharmacyID)
			if tc.HasErr {
				return
			}
			if err != nil {
				if !tc.HasErr {
					t.Fatal("PharmacyIDToStationDefaultPharmacyParams returned an unexpected error: ", err.Error())
				}
			} else {
				testutils.MustMatch(t, stationDefaultPharmacyParams, tc.WantDefaultPharmacyParams, "pharmacy params don't match")
			}
		})
	}
}

func exampleStationDefaultPharmacy() *patient.StationPharmacy {
	return &patient.StationPharmacy{
		ClinicalProviderID:   proto.String(pharmacyID),
		ClinicalProviderName: proto.String(pharmacyName),
		PharmacyType:         proto.String(pharmacyType),
		State:                proto.String(pharmacyState),
		City:                 proto.String(pharmacyCity),
		ReceiverType:         proto.String(pharmacyReceiverType),
		AcceptFax:            proto.String(pharmacyAcceptFax),
		Zip:                  proto.String(pharmacyZip),
		PhoneNumber:          proto.String(pharmacyPhoneNumber),
		Address1:             proto.String(pharmacyAddress1),
		FaxNumber:            proto.String(pharmacyFaxNumber),
	}
}

func exampleDefaultPharmacyProto() *patientspb.Pharmacy {
	return &patientspb.Pharmacy{
		ClinicalProviderId:   proto.String(pharmacyID),
		ClinicalProviderName: proto.String(pharmacyName),
		PharmacyType:         patientspb.PharmacyType_PHARMACY_TYPE_RETAIL.Enum(),
		Address: &commonpb.Address{
			AddressLineOne: proto.String(pharmacyAddress1),
			City:           proto.String(pharmacyCity),
			State:          proto.String(pharmacyState),
			ZipCode:        proto.String(pharmacyZip),
		},
		ReceiverType: proto.String(pharmacyReceiverType),
		AcceptFax:    proto.Bool(true),
		PhoneNumber: &commonpb.PhoneNumber{
			PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(303) 320-7847"),
		},
		FaxNumber: proto.String(pharmacyFaxNumber),
	}
}

func exampleStationDefaultPharmacyParams() *patient.StationDefaultPharmacyParams {
	return &patient.StationDefaultPharmacyParams{
		DefaultPharmacy: &patient.StationDefaultPharmacyParamsPayload{
			DefaultPharmacyID: pharmacyID,
		},
	}
}
