package main

import (
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
)

var (
	errNoPatientID        = errors.New("TytoCare patient requires id")
	errNoPatientFirstName = errors.New("TytoCare patient requires first name")
	errNoPatientLastName  = errors.New("TytoCare patient requires last name")
	errInvalidSex         = errors.New("Invalid sex specified, must be Male or Female")
	errNoDateSpecified    = errors.New("no date specified")
	errNoPatientProto     = errors.New("patient proto cannot be nil")
)

func ProtoToTytoCarePatient(patientProto *tytocarepb.CreatePatientRequest) (*TytoCareCreatePatientRequest, error) {
	if patientProto == nil {
		return nil, errNoPatientProto
	}

	if patientProto.Id == "" {
		return nil, errNoPatientID
	}

	if patientProto.FirstName == "" {
		return nil, errNoPatientFirstName
	}

	if patientProto.LastName == "" {
		return nil, errNoPatientLastName
	}

	sex, err := tytoCareSex(&patientProto.Sex)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse sex to TytoCare sex")
	}

	dateOfBirth, err := tytoCareDate(patientProto.DateOfBirth)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse TytoCare date of birth")
	}

	return &TytoCareCreatePatientRequest{
		Identifier:  &patientProto.Id,
		FirstName:   &patientProto.FirstName,
		LastName:    &patientProto.LastName,
		DateOfBirth: dateOfBirth,
		Sex:         sex,
	}, nil
}

func tytoCareSex(sex *commonpb.Sex) (*string, error) {
	if sex == nil {
		return nil, errInvalidSex
	}

	var tytoCareSex *string
	switch *sex {
	case commonpb.Sex_SEX_MALE:
		tytoCareSex = proto.String("M")
	case commonpb.Sex_SEX_FEMALE:
		tytoCareSex = proto.String("F")
	default:
		return nil, errInvalidSex
	}

	return tytoCareSex, nil
}

func tytoCareDate(date *commonpb.Date) (*string, error) {
	if date == nil {
		return nil, errNoDateSpecified
	}

	// TODO: Use a proto converters package
	parsedDate := time.Date(int(date.GetYear()), time.Month(date.GetMonth()), int(date.GetDay()), 0, 0, 0, 0, time.UTC)
	formattedDate := parsedDate.Format(time.RFC3339)

	return &formattedDate, nil
}
