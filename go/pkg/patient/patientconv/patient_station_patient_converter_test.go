package patientconv

import (
	"strconv"
	"testing"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

var (
	ehrID                             = proto.String("123")
	channelItemID                     = proto.Int64(1234)
	sourceType                        = proto.String("source type")
	partnerID                         = proto.String("456")
	patientIDInt                      = proto.Int64(5678)
	flagType                          = proto.String("FLAG_TYPE_TEMPORARY")
	flagTypeInt                       = commonpb.PatientSafetyFlag_FlagType(1)
	flagReason                        = proto.String("flag reason")
	flaggerID                         = proto.Int64(9012)
	preferredName                     = proto.String("Preferred Name")
	invalidPreferredName              = proto.String("")
	relationship                      = proto.String("self")
	relationshipInt                   = commonpb.RelationToPatient(1)
	invalidRelationshipInt            = commonpb.RelationToPatient(999)
	phoneNumber                       = proto.String("5551234567")
	invalidPhoneNumber                = proto.String("")
	phoneNumberTypeMobile             = commonpb.PhoneNumber_PhoneNumberType(2)
	voicemailConsent                  = proto.Bool(true)
	billingCityIDInt                  = proto.Int64(7890)
	stationPOARelationshipUnspecified = proto.String("")

	goodPatient = stationpatientspb.Patient{
		Id:            *patientIDInt,
		ChannelItemId: channelItemID,
		SourceType:    sourceType,
		PartnerId:     partnerID,
		PatientSafetyFlag: &stationpatientspb.PatientSafetyFlag{
			PatientId:  patientIDInt,
			FlagType:   flagType,
			FlagReason: flagReason,
			FlaggerId:  flaggerID,
		},
		VoicemailConsent: voicemailConsent,
		BillingCity: &stationpatientspb.BillingCity{
			Id: billingCityIDInt,
		},
		PowerOfAttorney: &stationpatientspb.PowerOfAttorney{
			PatientId:    patientIDInt,
			Name:         preferredName,
			Relationship: relationship,
			Phone:        phoneNumber,
		},
		EhrId:        ehrID,
		MobileNumber: phoneNumber,
	}
)

func Test_PatientToStationPatientProto(t *testing.T) {
	tests := []struct {
		Desc         string
		EhrID        string
		InputPatient *commonpb.Patient
		WantPatient  *stationpatientspb.Patient
		hasErr       bool
	}{
		{
			Desc:  "Base Case",
			EhrID: *ehrID,
			InputPatient: &commonpb.Patient{
				Id:            proto.String(strconv.FormatInt(*patientIDInt, 10)),
				ChannelItemId: channelItemID,
				SourceType:    sourceType,
				PartnerId:     partnerID,
				PatientSafetyFlag: &commonpb.PatientSafetyFlag{
					Type:          flagTypeInt,
					Reason:        flagReason,
					FlaggerUserId: strconv.FormatInt(*flaggerID, 10),
				},
				VoicemailConsent: voicemailConsent,
				BillingCity: &commonpb.BillingCity{
					Id: strconv.FormatInt(*billingCityIDInt, 10),
				},
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
				ContactInfo: &commonpb.ContactInfo{
					MobileNumber: &commonpb.PhoneNumber{
						PhoneNumber:     phoneNumber,
						PhoneNumberType: phoneNumberTypeMobile,
					},
				},
			},
			WantPatient: &goodPatient,
			hasErr:      false,
		},
		{
			Desc:  "Patient with invalid flagger user ID",
			EhrID: *ehrID,
			InputPatient: &commonpb.Patient{
				Id: proto.String(strconv.FormatInt(*patientIDInt, 10)),
				PatientSafetyFlag: &commonpb.PatientSafetyFlag{
					Type:          flagTypeInt,
					Reason:        flagReason,
					FlaggerUserId: "bad flagger id",
				},
			},
			hasErr: true,
		},
		{
			Desc:  "Patient with invalid billingCity ID",
			EhrID: *ehrID,
			InputPatient: &commonpb.Patient{
				Id: proto.String(strconv.FormatInt(*patientIDInt, 10)),
				BillingCity: &commonpb.BillingCity{
					Id: "bad billing city id",
				},
			},
			hasErr: true,
		},
		{
			Desc:  "Patient without billing city, safety flag, or power of attorney",
			EhrID: *ehrID,
			InputPatient: &commonpb.Patient{
				Id:               proto.String(strconv.FormatInt(*patientIDInt, 10)),
				ChannelItemId:    channelItemID,
				SourceType:       sourceType,
				PartnerId:        partnerID,
				VoicemailConsent: voicemailConsent,
				ContactInfo: &commonpb.ContactInfo{
					MobileNumber: &commonpb.PhoneNumber{
						PhoneNumber:     phoneNumber,
						PhoneNumberType: phoneNumberTypeMobile,
					},
				},
			},
			WantPatient: &stationpatientspb.Patient{
				Id:               *patientIDInt,
				ChannelItemId:    channelItemID,
				SourceType:       sourceType,
				PartnerId:        partnerID,
				VoicemailConsent: voicemailConsent,
				EhrId:            ehrID,
				MobileNumber:     phoneNumber,
			},
			hasErr: false,
		},
	}
	for _, test := range tests {
		t.Run(test.Desc, func(t *testing.T) {
			got, err := StationPatientProto(&test.EhrID, test.InputPatient)
			testutils.MustMatch(t, test.hasErr, err != nil)
			testutils.MustMatchProto(t, test.WantPatient, got)
		})
	}
}

func Test_StationPowerOfAttorneyRelationProto(t *testing.T) {
	tests := []struct {
		Desc  string
		Input commonpb.RelationToPatient
		Want  string
	}{
		{
			Desc:  "relation to patient self",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
			Want:  "self",
		},
		{
			Desc:  "relation to patient facility staff",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_FACILITY_STAFF,
			Want:  "facility_staff",
		},
		{
			Desc:  "relation to patient family",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_FAMILY,
			Want:  "family",
		},
		{
			Desc:  "relation to patient clinician",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_CLINICIAN,
			Want:  "clinician",
		},
		{
			Desc:  "relation to patient friend",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_FRIEND,
			Want:  "friend",
		},
		{
			Desc:  "relation to patient home health team",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM,
			Want:  "home_health_team",
		},
		{
			Desc:  "relation to patient case management",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT,
			Want:  "case_management",
		},
		{
			Desc:  "relation to patient other",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER,
			Want:  "other",
		},
		{
			Desc:  "unspecified relation to patient",
			Input: commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
			Want:  "",
		},
	}

	for _, test := range tests {
		t.Run(test.Desc, func(t *testing.T) {
			got := StationPowerOfAttorneyRelationProto(test.Input)
			testutils.MustMatch(t, test.Want, got)
		})
	}
}

func Test_StationPowerOfAttorneyProto(t *testing.T) {
	tests := []struct {
		Desc           string
		InputPatient   *commonpb.Patient
		InputPatientID *int64

		Want   *stationpatientspb.PowerOfAttorney
		hasErr bool
	}{
		{
			Desc: "base case",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			Want: &stationpatientspb.PowerOfAttorney{
				Id:           proto.Int64(1),
				PatientId:    patientIDInt,
				Name:         preferredName,
				Relationship: relationship,
				Phone:        phoneNumber,
			},
		},
		{
			Desc:         "nil POA",
			InputPatient: &commonpb.Patient{},
		},
		{
			Desc: "nil patient relation",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "returns unspecified if patient relation name is invalid",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: invalidRelationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			Want: &stationpatientspb.PowerOfAttorney{
				Id:           proto.Int64(1),
				PatientId:    patientIDInt,
				Name:         preferredName,
				Relationship: stationPOARelationshipUnspecified,
				Phone:        phoneNumber,
			},
		},
		{
			Desc: "nil name",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id:   proto.Int64(1),
					Name: &commonpb.Name{},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "nil preferred name",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id:   proto.Int64(1),
					Name: &commonpb.Name{},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "invalid preferred name",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: invalidPreferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber:     phoneNumber,
							PhoneNumberType: phoneNumberTypeMobile,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "nil contact info",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "nil contact info mobile number",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "nil contact info phone number",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
		{
			Desc: "invalid contact info phone number",
			InputPatient: &commonpb.Patient{
				MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
					Id: proto.Int64(1),
					Name: &commonpb.Name{
						PreferredName: preferredName,
					},
					ContactInfo: &commonpb.ContactInfo{
						MobileNumber: &commonpb.PhoneNumber{
							PhoneNumber: invalidPhoneNumber,
						},
					},
					PatientRelation: &commonpb.PatientRelation{
						Relation: relationshipInt,
					},
				},
			},
			InputPatientID: patientIDInt,

			hasErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.Desc, func(t *testing.T) {
			got, err := StationPowerOfAttorneyProto(test.InputPatientID, test.InputPatient)
			testutils.MustMatch(t, test.hasErr, err != nil)
			testutils.MustMatchProto(t, test.Want, got)
		})
	}
}
