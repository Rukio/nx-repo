package main

import (
	"database/sql"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	sqlGenderIdentityToProtoMap = map[patientssql.GenderIdentity]commonpb.GenderIdentity_Category{
		patientssql.GenderIdentityOther:       commonpb.GenderIdentity_CATEGORY_OTHER,
		patientssql.GenderIdentityF:           commonpb.GenderIdentity_CATEGORY_FEMALE,
		patientssql.GenderIdentityFtm:         commonpb.GenderIdentity_CATEGORY_FEMALE_TO_MALE,
		patientssql.GenderIdentityM:           commonpb.GenderIdentity_CATEGORY_MALE,
		patientssql.GenderIdentityMtf:         commonpb.GenderIdentity_CATEGORY_MALE_TO_FEMALE,
		patientssql.GenderIdentityNb:          commonpb.GenderIdentity_CATEGORY_NON_BINARY,
		patientssql.GenderIdentityUndisclosed: commonpb.GenderIdentity_CATEGORY_UNDISCLOSED,
	}
	protoGenderIdentityToSQLMap = map[commonpb.GenderIdentity_Category]patientssql.GenderIdentity{
		commonpb.GenderIdentity_CATEGORY_OTHER:          patientssql.GenderIdentityOther,
		commonpb.GenderIdentity_CATEGORY_FEMALE:         patientssql.GenderIdentityF,
		commonpb.GenderIdentity_CATEGORY_FEMALE_TO_MALE: patientssql.GenderIdentityFtm,
		commonpb.GenderIdentity_CATEGORY_MALE:           patientssql.GenderIdentityM,
		commonpb.GenderIdentity_CATEGORY_MALE_TO_FEMALE: patientssql.GenderIdentityMtf,
		commonpb.GenderIdentity_CATEGORY_NON_BINARY:     patientssql.GenderIdentityNb,
		commonpb.GenderIdentity_CATEGORY_UNDISCLOSED:    patientssql.GenderIdentityUndisclosed,
	}
)

func SQLSexToProto(sex patientssql.Sex) commonpb.Sex {
	switch sex {
	case patientssql.SexM:
		return commonpb.Sex_SEX_MALE
	case patientssql.SexF:
		return commonpb.Sex_SEX_FEMALE
	default:
		return commonpb.Sex_SEX_UNSPECIFIED
	}
}

func ProtoSexToSQL(sex commonpb.Sex) patientssql.Sex {
	switch sex {
	case commonpb.Sex_SEX_MALE:
		return patientssql.SexM
	case commonpb.Sex_SEX_FEMALE:
		return patientssql.SexF
	default:
		return patientssql.SexU
	}
}

func ProtoGenderIdentityCategoryToSQL(gi commonpb.GenderIdentity_Category) patientssql.GenderIdentity {
	result, ok := protoGenderIdentityToSQLMap[gi]
	if !ok {
		return patientssql.GenderIdentityU
	}

	return result
}

func SQLGenderIdentityCategoryToProto(gi patientssql.GenderIdentity) commonpb.GenderIdentity_Category {
	result, ok := sqlGenderIdentityToProtoMap[gi]
	if !ok {
		return commonpb.GenderIdentity_CATEGORY_UNSPECIFIED
	}

	return result
}

func SQLGenderIdentityToProto(gi patientssql.GenderIdentity, otherDetails *string) *commonpb.GenderIdentity {
	return &commonpb.GenderIdentity{
		Category:     SQLGenderIdentityCategoryToProto(gi),
		OtherDetails: otherDetails,
	}
}

func UnverifiedSQLPatientToAddUnverifiedPatientParams(patient *patientssql.UnverifiedPatient) *patientssql.AddUnverifiedPatientParams {
	return &patientssql.AddUnverifiedPatientParams{
		AthenaID:              patient.AthenaID,
		DateOfBirth:           patient.DateOfBirth,
		GivenName:             patient.GivenName,
		FamilyName:            patient.FamilyName,
		PhoneNumber:           patient.PhoneNumber,
		LegalSex:              patient.LegalSex,
		BirthSexID:            patient.BirthSexID,
		GenderIdentity:        patient.GenderIdentity,
		GenderIdentityDetails: patient.GenderIdentityDetails,
	}
}

func ToUnverifiedPatientSQL(patient *patientspb.UnverifiedPatient) (*patientssql.UnverifiedPatient, error) {
	dob := protoconv.ProtoDateToTime(patient.DateOfBirth)
	var phoneNumber sql.NullString
	if patient.PhoneNumber != nil && patient.PhoneNumber.GetPhoneNumber() != "" {
		formattedNumber, err := protoconv.PhoneNumberProto(patient.PhoneNumber.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE)
		if err != nil {
			return nil, errors.New("failed to convert mobile number")
		}
		phoneNumber = sqltypes.ToNullString(formattedNumber.PhoneNumber)
	}

	legalSex := ProtoSexToSQL(patient.LegalSex)
	var genderIdentity patientssql.NullGenderIdentity
	var genderIdentityDetails sql.NullString
	if patient.GenderIdentity != nil {
		genderIdentity = ToNullGenderIdentity(ProtoGenderIdentityCategoryToSQL(patient.GenderIdentity.Category))
		genderIdentityDetails = sqltypes.ToNullString(patient.GenderIdentity.OtherDetails)
	}

	return &patientssql.UnverifiedPatient{
		ID:                    patient.Id,
		AthenaID:              sqltypes.ToNullInt64(patient.AthenaId),
		DateOfBirth:           *dob,
		GivenName:             patient.GetGivenName(),
		FamilyName:            patient.GetFamilyName(),
		PhoneNumber:           phoneNumber,
		LegalSex:              legalSex,
		BirthSexID:            sqltypes.ToNullInt64(BirthSexProtoToBirthSexID[patient.BirthSex]),
		GenderIdentity:        genderIdentity,
		GenderIdentityDetails: genderIdentityDetails,
		PatientID:             sqltypes.ToNullInt64(patient.PatientId),
	}, nil
}

func UnverifiedPatientSQLToProto(patient *patientssql.UnverifiedPatient) *patientspb.UnverifiedPatient {
	var birthSex commonpb.BirthSex
	if patient.BirthSexID.Valid {
		birthSex = BirthSexIDToProto[patient.BirthSexID.Int64]
	}
	var genderIdentityDetails *string
	if patient.GenderIdentityDetails.Valid {
		genderIdentityDetails = &patient.GenderIdentityDetails.String
	}

	var genderIdentity *commonpb.GenderIdentity
	if patient.GenderIdentity.Valid {
		genderIdentity = SQLGenderIdentityToProto(patient.GenderIdentity.GenderIdentity, genderIdentityDetails)
	}

	var phoneNumber *commonpb.PhoneNumber
	if patient.PhoneNumber.Valid {
		phoneNumber = &commonpb.PhoneNumber{PhoneNumber: &patient.PhoneNumber.String}
	}

	var athenaID *int64
	if patient.AthenaID.Valid {
		athenaID = &patient.AthenaID.Int64
	}

	var patientID *int64
	if patient.PatientID.Valid {
		patientID = &patient.PatientID.Int64
	}

	return &patientspb.UnverifiedPatient{
		Id:             patient.ID,
		AthenaId:       athenaID,
		DateOfBirth:    protoconv.TimeToProtoDate(&patient.DateOfBirth),
		GivenName:      &patient.GivenName,
		FamilyName:     &patient.FamilyName,
		PhoneNumber:    phoneNumber,
		LegalSex:       SQLSexToProto(patient.LegalSex),
		BirthSex:       birthSex,
		GenderIdentity: genderIdentity,
		CreatedAt:      timestamppb.New(patient.CreatedAt),
		UpdatedAt:      timestamppb.New(patient.UpdatedAt),
		PatientId:      patientID,
	}
}

func ToNullSex(s patientssql.Sex) patientssql.NullSex {
	switch s {
	case patientssql.SexM, patientssql.SexF, patientssql.SexU:
		return patientssql.NullSex{
			Sex:   s,
			Valid: true,
		}
	default:
		return patientssql.NullSex{
			Valid: false,
		}
	}
}

func ToNullGenderIdentity(identity patientssql.GenderIdentity) patientssql.NullGenderIdentity {
	switch identity {
	case patientssql.GenderIdentityM, patientssql.GenderIdentityF, patientssql.GenderIdentityMtf, patientssql.GenderIdentityFtm, patientssql.GenderIdentityNb, patientssql.GenderIdentityU, patientssql.GenderIdentityOther:
		return patientssql.NullGenderIdentity{
			GenderIdentity: identity,
			Valid:          true,
		}
	default:
		return patientssql.NullGenderIdentity{
			Valid: false,
		}
	}
}
