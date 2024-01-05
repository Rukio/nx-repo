package patientconv

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/nyaruka/phonenumbers"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	usPhoneNumberRegionCode               = "US"
	athenaEHRName                         = "athena"
	dateLayout                            = "2006-01-02"
	timestampLayout                       = "2006-01-02T15:04:05.999Z"
	stringRelationToPatientSelf           = "self"
	stringRelationToPatientFacilityStaff  = "facility_staff"
	stringRelationToPatientFamily         = "family"
	stringRelationToPatientClinician      = "clinician"
	stringRelationToPatientFriend         = "friend"
	stringRelationToPatientHomeHealthTeam = "home_health_team"
	stringRelationToPatientCaseManagement = "case_management"
	stringRelationToPatientUnspecified    = ""
	stringRelationToPatientOther          = "other"
)

var (
	errNoStationPatient   = errors.New("station patient cannot be nil")
	errNoStationPatientID = errors.New("station patient requires id")
	errNoDateSpecified    = errors.New("no date specified")
	emptyAddress          = commonpb.Address{}
	emptyContactInfo      = commonpb.ContactInfo{}
	emptyName             = commonpb.Name{}
	emptyGuarantor        = commonpb.Guarantor{}
	emptyPowerOfAttorney  = commonpb.MedicalPowerOfAttorney{}

	errNoPatientProto = errors.New("patient proto cannot be nil")
)

func StationPatientToProto(stationPatient *patient.StationPatient) (*commonpb.Patient, error) {
	if stationPatient == nil {
		return nil, errNoStationPatient
	}
	if stationPatient.ID == nil {
		return nil, errNoStationPatientID
	}

	dateOfBirth, err := protoconv.DateProto(stationPatient.DateOfBirth, dateLayout)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse station patient date of birth")
	}

	contactInfo, err := contactInfoProto(stationPatient)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse contact info")
	}

	guarantor, err := guarantorProto(stationPatient)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse guarantor")
	}

	mpoa, err := medicalPowerOfAttorneyProto(stationPatient.PowerOfAttorney)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse power of attorney")
	}

	updatedAt, err := timestampProto(stationPatient.UpdatedAt)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse updated at timestamp")
	}

	return &commonpb.Patient{
		Id:                     proto.String(strconv.FormatInt(*stationPatient.ID, 10)),
		DateOfBirth:            dateOfBirth,
		Name:                   nameProto(stationPatient),
		PrimaryIdentifier:      patientRecordIdentifierProto(stationPatient.StationEHRIdentifier),
		ContactInfo:            contactInfo,
		Sex:                    sexProto(stationPatient.Gender),
		SocialSecurityNumber:   stationPatient.SocialSecurityNumber,
		Guarantor:              guarantor,
		MedicalPowerOfAttorney: mpoa,
		PatientSafetyFlag:      patientSafetyFlagProto(stationPatient.PatientSafetyFlag),
		UpdatedAt:              updatedAt,
		VoicemailConsent:       stationPatient.VoicemailConsent,
		BillingCity:            billingCityProto(stationPatient.StationBillingCity),
	}, nil
}

func ProtoToStationPatient(patientProto *commonpb.Patient) (*patient.StationPatient, error) {
	if patientProto == nil {
		return nil, errNoPatientProto
	}

	patientID, err := parseInt(patientProto.GetId())
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto id to station id")
	}

	dateOfBirth, err := stationDate(patientProto.DateOfBirth)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto date of birth to station date")
	}

	guarantor, err := stationGuarantor(patientProto)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto guarantor to station guarantor")
	}

	phoneNumber, err := stationPhoneNumber(patientProto.ContactInfo)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto phone number to station phone")
	}

	powerOfAttorney, err := stationPowerOfAttorney(patientProto.MedicalPowerOfAttorney)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse proto power of attorney to station power of attorney")
	}

	safetyFlag, err := stationSafetyFlag(patientProto.PatientSafetyFlag)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse safety flag to station safety flag")
	}

	return &patient.StationPatient{
		ID:                    patientID,
		StationName:           stationName(patientProto.Name),
		StationPhone:          phoneNumber,
		PatientEmail:          stationEmail(patientProto.ContactInfo),
		DateOfBirth:           dateOfBirth,
		Gender:                stationGender(patientProto.Sex),
		SocialSecurityNumber:  patientProto.SocialSecurityNumber,
		StationEHRIdentifier:  stationEHR(patientProto.PrimaryIdentifier),
		StationBillingAddress: stationAddress(patientProto.ContactInfo),
		PowerOfAttorney:       powerOfAttorney,
		Guarantor:             guarantor,
		PatientSafetyFlag:     safetyFlag,
		UpdatedAt:             stationTimestamp(patientProto.UpdatedAt),
		VoicemailConsent:      patientProto.VoicemailConsent,
		StationBillingCity:    stationBillingCity(patientProto.BillingCity),
	}, nil
}

func patientRecordIdentifierProto(ehr *patient.StationEHRIdentifier) *commonpb.PatientRecordIdentifier {
	if ehr == nil {
		return nil
	}

	if ehr.EHRName == nil || ehr.EHRID == nil {
		return nil
	}
	source := commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_UNSPECIFIED
	if strings.ToLower(*ehr.EHRName) == athenaEHRName {
		source = commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA
	}
	return &commonpb.PatientRecordIdentifier{
		Source:   source,
		RecordId: *ehr.EHRID,
	}
}

func addressProto(stationAddress *patient.StationBillingAddress) *commonpb.Address {
	if stationAddress == nil {
		return nil
	}

	address := commonpb.Address{
		AddressLineOne: stationAddress.BillingAddressStreetAddress1,
		AddressLineTwo: stationAddress.BillingAddressStreetAddress2,
		City:           stationAddress.BillingAddressCity,
		State:          stationAddress.BillingAddressState,
		ZipCode:        stationAddress.BillingAddressZipcode,
	}

	if proto.Equal(&address, &emptyAddress) {
		return nil
	}
	return &address
}

func contactInfoProto(stationPatient *patient.StationPatient) (*commonpb.ContactInfo, error) {
	if stationPatient.StationPhone == nil {
		return nil, nil
	}

	phoneNumberType := commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME
	if stationPatient.PhoneNumberType != nil && stationPatient.PhoneNumberType.IsMobile {
		phoneNumberType = commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE
	}
	phoneNumber, err := protoconv.PhoneNumberProto(stationPatient.MobileNumber, phoneNumberType)
	if err != nil {
		return nil, errors.Wrap(err, "could not parse patient phone number")
	}

	contactInfo := commonpb.ContactInfo{
		Address: addressProto(stationPatient.StationBillingAddress),
		Email:   stationPatient.PatientEmail,
	}
	switch phoneNumberType {
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME:
		contactInfo.HomeNumber = phoneNumber
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE:
		contactInfo.MobileNumber = phoneNumber
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK:
		contactInfo.WorkNumber = phoneNumber
	}
	if proto.Equal(&contactInfo, &emptyContactInfo) {
		return nil, nil
	}
	return &contactInfo, nil
}

func sexProto(gender *string) *commonpb.Sex {
	if gender == nil {
		return nil
	}
	sex := commonpb.Sex_SEX_UNSPECIFIED
	switch strings.ToLower(*gender) {
	case "male", "m":
		sex = commonpb.Sex_SEX_MALE
	case "female", "f":
		sex = commonpb.Sex_SEX_FEMALE
	case "":
		sex = commonpb.Sex_SEX_UNSPECIFIED
	default:
		sex = commonpb.Sex_SEX_OTHER
	}
	return &sex
}

var patientRelationToSubscriberTypes = map[string]patientspb.PatientRelationToSubscriber{
	"self":    patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT,
	"patient": patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT,
	"mother":  patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_MOTHER,
	"father":  patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_FATHER,
	"child":   patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_CHILD,
	"spouse":  patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE,
	"friend":  patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_FRIEND,
	"other":   patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_OTHER,
}

func patientRelationToSubscriberProto(relation *string) *patientspb.PatientRelationToSubscriber {
	if relation == nil {
		return nil
	}

	patientRelation, ok := patientRelationToSubscriberTypes[*relation]
	if !ok {
		patientRelation = patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED
	}
	return &patientRelation
}

var patientRelationTypes = map[string]commonpb.RelationToPatient{
	stringRelationToPatientSelf:           commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
	stringRelationToPatientFacilityStaff:  commonpb.RelationToPatient_RELATION_TO_PATIENT_FACILITY_STAFF,
	stringRelationToPatientFamily:         commonpb.RelationToPatient_RELATION_TO_PATIENT_FAMILY,
	stringRelationToPatientClinician:      commonpb.RelationToPatient_RELATION_TO_PATIENT_CLINICIAN,
	stringRelationToPatientFriend:         commonpb.RelationToPatient_RELATION_TO_PATIENT_FRIEND,
	stringRelationToPatientHomeHealthTeam: commonpb.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM,
	stringRelationToPatientCaseManagement: commonpb.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT,
	stringRelationToPatientUnspecified:    commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
}

func patientRelationProto(relation *string) *commonpb.PatientRelation {
	if relation == nil {
		return nil
	}

	patientRelation, ok := patientRelationTypes[*relation]
	if !ok {
		return &commonpb.PatientRelation{
			Relation:          commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER,
			OtherRelationText: relation,
		}
	}
	return &commonpb.PatientRelation{Relation: patientRelation}
}

func patientSafetyFlagProto(safetyFlag *patient.StationPatientSafetyFlag) *commonpb.PatientSafetyFlag {
	if safetyFlag == nil {
		return nil
	}

	var flagType commonpb.PatientSafetyFlag_FlagType
	switch *safetyFlag.FlagType {
	case "temporary":
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_TEMPORARY
	case "permanent":
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_PERMANENT
	default:
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_UNSPECIFIED
	}

	return &commonpb.PatientSafetyFlag{
		FlaggerUserId: strconv.FormatInt(*safetyFlag.FlaggerID, 10),
		Reason:        safetyFlag.FlagReason,
		Type:          flagType,
	}
}

func billingCityProto(billingCity *patient.StationBillingCity) *commonpb.BillingCity {
	if billingCity == nil || billingCity.BillingCityID == nil {
		return nil
	}

	return &commonpb.BillingCity{
		Id: *billingCity.BillingCityID,
	}
}

func nameProto(stationPatient *patient.StationPatient) *commonpb.Name {
	if stationPatient.StationName == nil {
		return nil
	}

	nameProto := commonpb.Name{
		GivenName:           stationPatient.FirstName,
		MiddleNameOrInitial: stationPatient.MiddleName,
		FamilyName:          stationPatient.LastName,
		Suffix:              stationPatient.Suffix,
	}
	if proto.Equal(&nameProto, &emptyName) {
		return nil
	}
	return &nameProto
}

func guarantorContactInfoProto(stationPatient *patient.StationPatient) (*commonpb.ContactInfo, error) {
	mobileNumber, err := protoconv.PhoneNumberProto(stationPatient.Guarantor.Phone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE)
	if err != nil {
		return nil, errors.Wrap(err, "could not parse guarantor phone number")
	}

	var address *commonpb.Address
	if stationPatient.Guarantor.SameAsCareAddress {
		address = addressProto(stationPatient.StationBillingAddress)
	} else {
		address = addressProto(stationPatient.Guarantor.StationBillingAddress)
	}

	contactInfo := commonpb.ContactInfo{
		Email:        stationPatient.Guarantor.Email,
		Address:      address,
		MobileNumber: mobileNumber,
	}
	if proto.Equal(&contactInfo, &emptyContactInfo) {
		return nil, nil
	}
	return &contactInfo, nil
}

func guarantorProto(stationPatient *patient.StationPatient) (*commonpb.Guarantor, error) {
	if stationPatient.Guarantor == nil || stationPatient.Guarantor.StationName == nil {
		return nil, nil
	}

	nameProto := &commonpb.Name{
		GivenName:  stationPatient.Guarantor.FirstName,
		FamilyName: stationPatient.Guarantor.LastName,
	}
	if proto.Equal(nameProto, &emptyName) {
		nameProto = nil
	}

	dateOfBirth, err := protoconv.DateProto(stationPatient.Guarantor.DateOfBirth, dateLayout)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse guarantor date of birth")
	}

	contactInfo, err := guarantorContactInfoProto(stationPatient)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse guarantor contact info")
	}

	guarantor := commonpb.Guarantor{
		Name:                 nameProto,
		DateOfBirth:          dateOfBirth,
		ContactInfo:          contactInfo,
		SocialSecurityNumber: stationPatient.Guarantor.SocialSecurityNumber,
		PatientRelation:      patientRelationProto(stationPatient.Guarantor.RelationshipToPatient),
	}
	if proto.Equal(&guarantor, &emptyGuarantor) {
		return nil, nil
	}
	return &guarantor, nil
}

func medicalPowerOfAttorneyContactInfoProto(powerOfAttorney *patient.StationPowerOfAttorney) (*commonpb.ContactInfo, error) {
	if powerOfAttorney == nil {
		return nil, nil
	}

	phoneNumberType := commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME
	if powerOfAttorney.PhoneNumberType != nil && powerOfAttorney.PhoneNumberType.IsMobile {
		phoneNumberType = commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE
	}

	phoneNumber, err := protoconv.PhoneNumberProto(powerOfAttorney.Phone, phoneNumberType)
	if err != nil {
		return nil, errors.Wrap(err, "could not parse power of attorney phone number")
	}

	var contactInfo commonpb.ContactInfo
	switch phoneNumberType {
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME:
		contactInfo.HomeNumber = phoneNumber
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE:
		contactInfo.MobileNumber = phoneNumber
	case commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK:
		contactInfo.WorkNumber = phoneNumber
	}

	if proto.Equal(&contactInfo, &emptyContactInfo) {
		return nil, nil
	}
	return &contactInfo, nil
}

func medicalPowerOfAttorneyProto(powerOfAttorney *patient.StationPowerOfAttorney) (*commonpb.MedicalPowerOfAttorney, error) {
	if powerOfAttorney == nil {
		return nil, nil
	}

	contactInfo, err := medicalPowerOfAttorneyContactInfoProto(powerOfAttorney)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse power of attorney contact info")
	}

	powerOfAttorneyName := &commonpb.Name{
		// MPOA only has full name right now in Station, so we store it in PreferredName.
		// TODO(PT-431): In the future when we switch away from Station towards EHR Proxy, collect MPOA first/last name.
		PreferredName: powerOfAttorney.Name,
	}
	if proto.Equal(powerOfAttorneyName, &emptyName) {
		powerOfAttorneyName = nil
	}

	powerOfAttorneyProto := &commonpb.MedicalPowerOfAttorney{
		Name:            powerOfAttorneyName,
		ContactInfo:     contactInfo,
		PatientRelation: patientRelationProto(powerOfAttorney.Relationship),
	}
	if proto.Equal(powerOfAttorneyProto, &emptyPowerOfAttorney) {
		return nil, nil
	}
	return powerOfAttorneyProto, nil
}

func timestampProto(timestamp *string) (*timestamppb.Timestamp, error) {
	if timestamp == nil {
		return nil, nil
	}

	updatedTime, err := time.Parse(timestampLayout, *timestamp)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("failed to parse timestamp %s", *timestamp))
	}
	return timestamppb.New(updatedTime), nil
}

func parseInt(s string) (*int64, error) {
	if s == "" {
		return nil, nil
	}

	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func stationName(name *commonpb.Name) *patient.StationName {
	if name == nil {
		return nil
	}

	return &patient.StationName{
		FirstName:  name.GivenName,
		MiddleName: name.MiddleNameOrInitial,
		LastName:   name.FamilyName,
		Suffix:     name.Suffix,
	}
}

func stationPhoneNumber(contactInfo *commonpb.ContactInfo) (*patient.StationPhone, error) {
	if contactInfo == nil {
		return nil, nil
	}

	var (
		number   string
		isMobile bool
	)

	if contactInfo.HomeNumber != nil {
		number = *contactInfo.HomeNumber.PhoneNumber
	}

	if contactInfo.MobileNumber != nil {
		number = *contactInfo.MobileNumber.PhoneNumber
		isMobile = true
	}

	num, err := phonenumbers.Parse(number, usPhoneNumberRegionCode)
	if err != nil {
		return nil, err
	}

	return &patient.StationPhone{
		MobileNumber: proto.String(phonenumbers.Format(num, phonenumbers.NATIONAL)),
		PhoneNumberType: &patient.StationPhoneNumberType{
			IsMobile: isMobile,
		},
	}, nil
}

func stationEmail(contactInfo *commonpb.ContactInfo) *string {
	if contactInfo == nil {
		return nil
	}
	return contactInfo.Email
}

func stationDate(date *commonpb.Date) (*string, error) {
	if date == nil {
		return nil, errNoDateSpecified
	}

	dateOfBirth := time.Date(int(date.GetYear()), time.Month(date.GetMonth()), int(date.GetDay()), 0, 0, 0, 0, time.UTC)
	dateOfBirthFormatted := dateOfBirth.Format(dateLayout)

	return &dateOfBirthFormatted, nil
}

func stationTimestamp(timestamp *timestamppb.Timestamp) *string {
	if timestamp == nil {
		return nil
	}

	updatedAt := timestamp.AsTime().Format(timestampLayout)
	return &updatedAt
}

func stationGender(sex *commonpb.Sex) *string {
	if sex == nil {
		return nil
	}

	var gender *string
	switch *sex {
	case commonpb.Sex_SEX_MALE:
		gender = proto.String("male")
	case commonpb.Sex_SEX_FEMALE:
		gender = proto.String("female")
	case commonpb.Sex_SEX_UNSPECIFIED:
		return nil
	case commonpb.Sex_SEX_OTHER:
		return nil
	}

	return gender
}

func stationAddress(contactInfo *commonpb.ContactInfo) *patient.StationBillingAddress {
	if contactInfo == nil || contactInfo.Address == nil {
		return nil
	}

	return &patient.StationBillingAddress{
		BillingAddressStreetAddress1: contactInfo.Address.AddressLineOne,
		BillingAddressStreetAddress2: contactInfo.Address.AddressLineTwo,
		BillingAddressCity:           contactInfo.Address.City,
		BillingAddressState:          contactInfo.Address.State,
		BillingAddressZipcode:        contactInfo.Address.ZipCode,
	}
}

func stationEHR(recordIdentifier *commonpb.PatientRecordIdentifier) *patient.StationEHRIdentifier {
	if recordIdentifier == nil {
		return nil
	}

	primaryIdentifier := patient.StationEHRIdentifier{
		EHRID: &recordIdentifier.RecordId,
	}

	if recordIdentifier.Source == commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA {
		primaryIdentifier.EHRName = proto.String(athenaEHRName)
	}

	if recordIdentifier.Source != commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA {
		return nil
	}

	return &primaryIdentifier
}

func stationPowerOfAttorney(powerOfAttorney *commonpb.MedicalPowerOfAttorney) (*patient.StationPowerOfAttorney, error) {
	if powerOfAttorney == nil {
		return nil, nil
	}

	phone, err := stationPhoneNumber(powerOfAttorney.ContactInfo)
	if err != nil {
		return nil, err
	}

	return &patient.StationPowerOfAttorney{
		// Proto MedicalPowerOfAttorney stores the full name in PreferredName field, so we store it in StationPowerOfAttorney Name field
		// TODO(PT-431): In the future when we switch away from Station towards EHR Proxy, collect MPOA first/last name.
		Name:            powerOfAttorney.Name.PreferredName,
		Relationship:    stationRelationship(powerOfAttorney.PatientRelation),
		Phone:           phone.MobileNumber,
		PhoneNumberType: phone.PhoneNumberType,
	}, nil
}

var patientRelationToInsured = map[patientspb.PatientRelationToSubscriber]*string{
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT:     proto.String("patient"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_MOTHER:      proto.String("mother"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_FATHER:      proto.String("father"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_CHILD:       proto.String("child"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE:      proto.String("spouse"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_FRIEND:      proto.String("friend"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_OTHER:       proto.String("other"),
	patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED: nil,
}

func stationRelationshipToInsured(relation patientspb.PatientRelationToSubscriber) *string {
	patientRelation, ok := patientRelationToInsured[relation]
	if !ok {
		return nil
	}

	return patientRelation
}

var patientRelations = map[commonpb.RelationToPatient]string{
	commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF:             "self",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_FACILITY_STAFF:   "facility_staff",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_FAMILY:           "family",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_CLINICIAN:        "clinician",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_FRIEND:           "friend",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM: "home_health_team",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT:  "case_management",
	commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED:      "",
}

func stationRelationship(relation *commonpb.PatientRelation) *string {
	if relation == nil {
		return nil
	}

	patientRelation, ok := patientRelations[relation.Relation]
	if !ok {
		return relation.OtherRelationText
	}

	return proto.String(patientRelation)
}

func stationGuarantor(patientProto *commonpb.Patient) (*patient.StationGuarantor, error) {
	if patientProto == nil || patientProto.Guarantor == nil {
		return nil, nil
	}

	var (
		dateOfBirth *string
		err         error
	)

	if patientProto.Guarantor.DateOfBirth != nil {
		dateOfBirth, err = stationDate(patientProto.Guarantor.DateOfBirth)
		if err != nil {
			return nil, errors.Wrap(err, "failed to parse proto guarantor date of birth to station date")
		}
	}

	phone, err := stationPhoneNumber(patientProto.Guarantor.ContactInfo)
	if err != nil {
		return nil, err
	}

	return &patient.StationGuarantor{
		RelationshipToPatient: stationRelationship(patientProto.Guarantor.PatientRelation),
		StationName:           stationName(patientProto.Guarantor.Name),
		DateOfBirth:           dateOfBirth,
		SocialSecurityNumber:  patientProto.Guarantor.SocialSecurityNumber,
		Phone:                 phone.MobileNumber,
		Email:                 stationEmail(patientProto.Guarantor.ContactInfo),
		SameAsCareAddress:     isSameCareAddress(patientProto),
		StationBillingAddress: stationAddress(patientProto.Guarantor.ContactInfo),
	}, nil
}

func isSameCareAddress(patient *commonpb.Patient) bool {
	return proto.Equal(patient.ContactInfo, patient.Guarantor.ContactInfo)
}

func stationSafetyFlag(safetyFlag *commonpb.PatientSafetyFlag) (*patient.StationPatientSafetyFlag, error) {
	if safetyFlag == nil {
		return nil, nil
	}

	flaggerID, err := parseInt(safetyFlag.GetFlaggerUserId())
	if err != nil {
		return nil, err
	}

	var flagType *string
	switch safetyFlag.Type {
	case commonpb.PatientSafetyFlag_FLAG_TYPE_TEMPORARY:
		flagType = proto.String("temporary")
	case commonpb.PatientSafetyFlag_FLAG_TYPE_PERMANENT:
		flagType = proto.String("permament")
	default:
		return nil, nil
	}

	return &patient.StationPatientSafetyFlag{
		FlaggerID:  flaggerID,
		FlagReason: safetyFlag.Reason,
		FlagType:   flagType,
	}, nil
}

func stationBillingCity(billingCity *commonpb.BillingCity) *patient.StationBillingCity {
	if billingCity.GetId() == "" {
		return nil
	}

	return &patient.StationBillingCity{
		BillingCityID: proto.String(billingCity.Id),
	}
}
