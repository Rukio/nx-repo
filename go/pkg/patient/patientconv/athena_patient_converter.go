package patientconv

import (
	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
)

func toAthenaPatientRelation(relation common.RelationToPatient) *string {
	var guarantorRelation string
	switch relation {
	case common.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED:
		guarantorRelation = "13"
	case common.RelationToPatient_RELATION_TO_PATIENT_SELF:
		guarantorRelation = "1"
	default:
		guarantorRelation = "4"
	}

	return &guarantorRelation
}

func toAthenaGuarantor(patientGuarantor *common.Guarantor) *athenapb.Guarantor {
	if patientGuarantor == nil {
		return nil
	}

	return &athenapb.Guarantor{
		Name:                  patientGuarantor.Name,
		DateOfBirth:           patientGuarantor.DateOfBirth,
		ContactInfo:           toAthenaContactInfo(patientGuarantor.ContactInfo),
		RelationshipToPatient: toAthenaPatientRelation(patientGuarantor.GetPatientRelation().GetRelation()),
	}
}

func toAthenaContactInfo(info *common.ContactInfo) *athenapb.ContactInfo {
	if info == nil {
		return nil
	}

	return &athenapb.ContactInfo{
		HomeNumber:   info.HomeNumber,
		MobileNumber: info.MobileNumber,
		WorkNumber:   info.WorkNumber,
		Email:        info.Email,
		Address:      info.Address,
	}
}

func ToAthenaPatient(patient *common.Patient, departmentID *string) *athenapb.Patient {
	athenaPatient := &athenapb.Patient{
		Name:         patient.Name,
		DateOfBirth:  patient.DateOfBirth,
		Sex:          converters.ProtoGenderToAthenaGender(patient.Sex),
		ContactInfo:  toAthenaContactInfo(patient.ContactInfo),
		Guarantor:    toAthenaGuarantor(patient.Guarantor),
		DepartmentId: departmentID,
	}

	if patient.PrimaryIdentifier != nil {
		athenaPatient.PatientId = &patient.GetPrimaryIdentifier().RecordId
	}

	return athenaPatient
}
