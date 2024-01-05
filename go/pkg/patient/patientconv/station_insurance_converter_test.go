package patientconv

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_eligibility"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	insuranceID = proto.String("1")
	patientID   = proto.String("2")
	memberID    = proto.String("3")
	groupID     = proto.String("4")

	priority = proto.String("1")

	insuranceStationID = proto.Int64(1)
	patientStationID   = proto.Int64(2)
	companyName        = proto.String("*company-data-covered*")
	packageID          = proto.String("testpackageid")
	insurancePlanID    = proto.Int64(51515)
)

func TestStationInsuranceToProto(t *testing.T) {
	unspecifiedRelation := patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED

	tcs := []struct {
		Desc           string
		InputInsurance *patient.StationInsuranceWithURL
		WantInsurance  *patientspb.InsuranceRecord
		HasErr         bool
	}{
		{
			Desc:           "Base case",
			InputInsurance: exampleStationInsuranceResponse(),
			WantInsurance:  exampleInsuranceProto(),
		},
		{
			Desc:           "Nil insurance",
			InputInsurance: nil,
			HasErr:         true,
		},
		{
			Desc:           "Empty insurance",
			InputInsurance: &patient.StationInsuranceWithURL{},
			HasErr:         true,
		},
		{
			Desc: "Insurance without id",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance without patient id",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:       insuranceStationID,
					MemberID: memberID,
					Priority: priority,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance without member id",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					Priority:  priority,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance without insurance priority",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance with wrong time format",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
					UpdatedAt: proto.String("1234567"),
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance with required fields",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
			},
			WantInsurance: &patientspb.InsuranceRecord{
				Id:        insuranceID,
				PatientId: patientID,
				MemberId:  memberID,
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
			},
		},
		{
			Desc: "Insurance with unknown relation",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
					PrimaryInsuranceHolder: &patient.StationPrimaryInsuranceHolder{
						PatientRelationshipToInsured: proto.String("1337"),
					},
				},
			},
			WantInsurance: &patientspb.InsuranceRecord{
				Id:        insuranceID,
				PatientId: patientID,
				MemberId:  memberID,
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
					PatientRelationToSubscriber: &unspecifiedRelation,
				},
			},
		},
		{
			Desc: "Insurance with nil relation",
			InputInsurance: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
					PrimaryInsuranceHolder: &patient.StationPrimaryInsuranceHolder{
						PatientRelationshipToInsured: nil,
					},
				},
			},
			WantInsurance: &patientspb.InsuranceRecord{
				Id:        insuranceID,
				PatientId: patientID,
				MemberId:  memberID,
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
					PatientRelationToSubscriber: nil,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedInsurance, err := StationInsuranceToProto(tc.InputInsurance)
			if tc.HasErr {
				return
			}
			if err != nil {
				t.Fatalf("StationInsuranceToProto hit unexpected error %s with test case %+v", err, tc)
			}
			if !proto.Equal(convertedInsurance, tc.WantInsurance) {
				t.Errorf("\ngot %s\nwant %s", convertedInsurance, tc.WantInsurance)
			}
		})
	}
}

func TestProtoToStationInsurance(t *testing.T) {
	tcs := []struct {
		Desc           string
		InputInsurance *patientspb.InsuranceRecord
		WantInsurance  *patient.StationInsuranceWithRawImage
		HasErr         bool
	}{
		{
			Desc:           "Base case",
			InputInsurance: exampleInsuranceProto(),
			WantInsurance:  exampleStationInsuranceRequest(),
		},
		{
			Desc:           "Nil Proto insurance",
			InputInsurance: nil,
			HasErr:         true,
		},
		{
			Desc: "Insurance Proto without id",
			InputInsurance: &patientspb.InsuranceRecord{
				PatientId: patientID,
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
			},
			WantInsurance: &patient.StationInsuranceWithRawImage{
				StationInsurance: patient.StationInsurance{
					ID:                          nil,
					PatientID:                   patientStationID,
					Priority:                    proto.String("1"),
					Eligible:                    proto.String(""),
					PatientRelationToSubscriber: proto.String("other"),
					InsuredSameAsPatient:        false,
				},
			},
		},
		{
			Desc: "Insurance Proto without patient id",
			InputInsurance: &patientspb.InsuranceRecord{
				Id:       insuranceID,
				Priority: patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY,
			},
			HasErr: true,
		},
		{
			Desc: "Insurance Proto with string id",
			InputInsurance: &patientspb.InsuranceRecord{
				Id:       proto.String("trolololol"),
				Priority: patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY,
			},
			HasErr: true,
		},
		{
			Desc: "Insurance Proto with string patient id",
			InputInsurance: &patientspb.InsuranceRecord{
				PatientId: proto.String("trolololol"),
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
			},
			HasErr: true,
		},
		{
			Desc: "Insurance Proto without insurance priority",
			InputInsurance: &patientspb.InsuranceRecord{
				Id:        insuranceID,
				PatientId: patientID,
			},
			HasErr: true,
		},
		{
			Desc: "Insurance with required fields",
			InputInsurance: &patientspb.InsuranceRecord{
				Id:        insuranceID,
				PatientId: patientID,
				Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY,
			},
			WantInsurance: &patient.StationInsuranceWithRawImage{
				StationInsurance: patient.StationInsurance{
					ID:                          insuranceStationID,
					PatientID:                   patientStationID,
					Priority:                    proto.String("3"),
					Eligible:                    proto.String(""),
					PatientRelationToSubscriber: proto.String("other"),
					InsuredSameAsPatient:        false,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedInsurance, err := ProtoToStationInsurance(tc.InputInsurance)
			if err != nil && !tc.HasErr {
				t.Fatalf("ProtoToStationInsurance hit unexpected error %s with test case %+v", err, tc)
			}
			testutils.MustMatch(t, tc.WantInsurance, convertedInsurance, "insurances don't match")
		})
	}
}

func exampleStationInsuranceRequest() *patient.StationInsuranceWithRawImage {
	return &patient.StationInsuranceWithRawImage{
		StationInsurance: patient.StationInsurance{
			ID:                 insuranceStationID,
			PatientID:          patientStationID,
			Priority:           priority,
			MemberID:           memberID,
			GroupNumber:        groupID,
			Eligible:           proto.String("Eligible"),
			EligibilityMessage: proto.String("patient eligible"),
			UpdatedAt:          proto.String("2022-04-25T00:05:51.008Z"),
			CompanyName:        companyName,
			PackageID:          packageID,
			InsurancePlanID:    insurancePlanID,
			PrimaryInsuranceHolder: &patient.StationPrimaryInsuranceHolder{
				StationPrimaryInsuranceHolderName: &patient.StationPrimaryInsuranceHolderName{
					FirstName:     proto.String("Kerry"),
					LastName:      proto.String("Simmons"),
					MiddleInitial: proto.String("K"),
				},
				Gender:                       proto.String("male"),
				PatientRelationshipToInsured: proto.String("patient"),
			},
			PatientRelationToSubscriber: proto.String("patient"),
			InsuredSameAsPatient:        true,
		},
		CardFront: proto.String("https://example.com/front"),
		CardBack:  proto.String("https://example.com/back"),
	}
}

func exampleStationInsuranceResponse() *patient.StationInsuranceWithURL {
	return &patient.StationInsuranceWithURL{
		StationInsurance: patient.StationInsurance{
			ID:                 insuranceStationID,
			PatientID:          patientStationID,
			Priority:           priority,
			MemberID:           memberID,
			GroupNumber:        groupID,
			Eligible:           proto.String("Eligible"),
			EligibilityMessage: proto.String("patient eligible"),
			UpdatedAt:          proto.String("2022-04-25T00:05:51.008Z"),
			CompanyName:        companyName,
			PackageID:          packageID,
			InsurancePlanID:    insurancePlanID,
			PrimaryInsuranceHolder: &patient.StationPrimaryInsuranceHolder{
				StationPrimaryInsuranceHolderName: &patient.StationPrimaryInsuranceHolderName{
					FirstName:     proto.String("Kerry"),
					LastName:      proto.String("Simmons"),
					MiddleInitial: proto.String("K"),
				},
				Gender:                       proto.String("male"),
				PatientRelationshipToInsured: proto.String("self"),
			},
		},
		CardFront: &patient.Card{
			URL: proto.String("https://example.com/front"),
			Thumb: patient.URL{
				URL: proto.String("https://example.com/front-thumb"),
			},
			Small: patient.URL{
				URL: proto.String("https://example.com/front-small"),
			},
		},
		CardBack: &patient.Card{
			URL: proto.String("https://example.com/back"),
			Thumb: patient.URL{
				URL: proto.String("https://example.com/back-thumb"),
			},
			Small: patient.URL{
				URL: proto.String("https://example.com/back-small"),
			},
		},
	}
}

func exampleInsuranceProto() *patientspb.InsuranceRecord {
	selfRelation := patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT
	return &patientspb.InsuranceRecord{
		Id:              insuranceID,
		PatientId:       patientID,
		Priority:        patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
		MemberId:        memberID,
		GroupId:         groupID,
		CompanyName:     companyName,
		PackageId:       packageID,
		InsurancePlanId: insurancePlanID,
		PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
			Name: &common.Name{
				GivenName:           proto.String("Kerry"),
				MiddleNameOrInitial: proto.String("K"),
				FamilyName:          proto.String("Simmons"),
			},
			Sex:                         common.Sex_SEX_MALE.Enum(),
			PatientRelationToSubscriber: &selfRelation,
		},
		EligibilityStatus:  insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
		EligibilityMessage: proto.String("patient eligible"),
		Images: map[int32]*patientspb.InsuranceImage{
			int32(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT): {
				ImageUrl:  proto.String("https://example.com/front"),
				ImageType: patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum(),
				Verified:  *proto.Bool(false),
			},
			int32(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK): {
				ImageUrl:  proto.String("https://example.com/back"),
				ImageType: patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum(),
				Verified:  *proto.Bool(false),
			},
		},
		UpdatedAt: &timestamppb.Timestamp{Seconds: 1650845151, Nanos: 8000000},
	}
}
