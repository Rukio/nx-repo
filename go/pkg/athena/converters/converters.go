package converters

import (
	"fmt"
	"log"
	"net/url"
	"reflect"
	"strconv"
	"strings"
	"time"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/nyaruka/phonenumbers"
	"github.com/pkg/errors"
	"golang.org/x/exp/slices"
	"google.golang.org/protobuf/proto"
)

const (
	dateLayout              = "01/02/2006"
	dateTimeLayout          = "01/02/2006 15:04:05"
	stringTrue              = "true"
	usPhoneNumberRegionCode = "US"
)

const (
	athenaSexMale   = "M"
	athenaSexFemale = "F"

	athenaBirthSexMale        = "M"
	athenaBirthSexFemale      = "F"
	athenaBirthSexUndisclosed = "N"
	athenaBirthSexUnknown     = "U"

	athenaGenderIdentityMale        = "Identifies as Male"
	athenaGenderIdentityFemale      = "Identifies as Female"
	athenaGenderIdentityMTF         = "Transgender Female/Male-to-Female (MTF)"
	athenaGenderIdentityFTM         = "Transgender Male/Female-to-Male (FTM)"
	athenaGenderIdentityNonBinary   = "Gender non-conforming (neither exclusively male nor female)"
	athenaGenderIdentityUndisclosed = "Choose not to disclose"
	athenaGenderIdentityOther       = "Additional gender category / other, please specify"
)

var (
	errNoCareTeamMember        = errors.New("care team member cannot be nil")
	errNoClinicalProvider      = errors.New("clinical provider cannot be nil")
	errNoClinicalProviderProto = errors.New("clinical provider proto cannot be nil")
	errNoSearchPatientResult   = errors.New("search patient cannot be nil")

	genderIdentityCategoryToAthenaGenderIdentity = map[commonpb.GenderIdentity_Category]string{
		commonpb.GenderIdentity_CATEGORY_MALE:           athenaGenderIdentityMale,
		commonpb.GenderIdentity_CATEGORY_FEMALE:         athenaGenderIdentityFemale,
		commonpb.GenderIdentity_CATEGORY_MALE_TO_FEMALE: athenaGenderIdentityMTF,
		commonpb.GenderIdentity_CATEGORY_FEMALE_TO_MALE: athenaGenderIdentityFTM,
		commonpb.GenderIdentity_CATEGORY_NON_BINARY:     athenaGenderIdentityNonBinary,
		commonpb.GenderIdentity_CATEGORY_UNDISCLOSED:    athenaGenderIdentityUndisclosed,
		commonpb.GenderIdentity_CATEGORY_OTHER:          athenaGenderIdentityOther,
	}

	athenaGenderIdentityToProto = func() map[string]commonpb.GenderIdentity_Category {
		res := make(map[string]commonpb.GenderIdentity_Category, len(genderIdentityCategoryToAthenaGenderIdentity))
		for k, v := range genderIdentityCategoryToAthenaGenderIdentity {
			res[v] = k
		}
		return res
	}()

	protoSexToAthenaSex = map[commonpb.Sex]*string{
		commonpb.Sex_SEX_MALE:   proto.String(athenaSexMale),
		commonpb.Sex_SEX_FEMALE: proto.String(athenaSexFemale),
	}

	athenaSexToProto = func() map[string]commonpb.Sex {
		res := make(map[string]commonpb.Sex, len(protoSexToAthenaSex))
		for k, v := range protoSexToAthenaSex {
			res[*v] = k
		}
		return res
	}()

	protoSexToAthenaBirthSex = map[commonpb.BirthSex]*string{
		commonpb.BirthSex_BIRTH_SEX_MALE:        proto.String(athenaBirthSexMale),
		commonpb.BirthSex_BIRTH_SEX_FEMALE:      proto.String(athenaBirthSexFemale),
		commonpb.BirthSex_BIRTH_SEX_UNDISCLOSED: proto.String(athenaBirthSexUndisclosed),
		commonpb.BirthSex_BIRTH_SEX_UNKNOWN:     proto.String(athenaBirthSexUnknown),
	}

	athenaBirthSexToProto = func() map[string]commonpb.BirthSex {
		res := make(map[string]commonpb.BirthSex, len(protoSexToAthenaBirthSex))
		for k, v := range protoSexToAthenaBirthSex {
			res[*v] = k
		}
		return res
	}()
)

func ProtoToEnhancedBestMatchRequest(request *athenapb.EnhancedBestMatchRequest) (*EnhancedBestMatchRequest, error) {
	dob := protoconv.ProtoDateToString(request.DateOfBirth, dateLayout)
	if dob == nil {
		return nil, errors.New("date of birth cannot be nil")
	}
	var homePhone, mobilePhone, guarantorPhone *string
	if request.HomePhoneNumber != nil && request.GetHomePhoneNumber().GetPhoneNumberType() != commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME {
		return nil, errors.New("home phone number field must have home phone number type")
	}
	if request.MobilePhoneNumber != nil && request.GetMobilePhoneNumber().GetPhoneNumberType() != commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE {
		return nil, errors.New("mobile phone number field must have mobile phone number type")
	}
	if request.HomePhoneNumber != nil {
		homePhone = request.HomePhoneNumber.PhoneNumber
	}
	if request.MobilePhoneNumber != nil {
		mobilePhone = request.MobilePhoneNumber.PhoneNumber
	}
	if request.GuarantorPhoneNumber != nil {
		guarantorPhone = request.GuarantorPhoneNumber.PhoneNumber
	}
	req := EnhancedBestMatchRequest{
		FirstName:         request.FirstName,
		LastName:          request.LastName,
		DateOfBirth:       *dob,
		Zip:               request.ZipCode,
		HomePhone:         homePhone,
		MobilePhone:       mobilePhone,
		GuarantorPhone:    guarantorPhone,
		Email:             request.Email,
		GuarantorEmail:    request.GuarantorEmail,
		DepartmentID:      request.DepartmentId,
		MinimumScore:      request.MinimumScore,
		UseSoundexSearch:  request.UseSoundexSearch,
		ReturnBestMatches: request.ReturnBestMatches,
	}
	return &req, nil
}

func EnhancedBestMatchResultToProto(result EnhancedBestMatchResult) (*athenapb.EnhancedBestMatchResult, error) {
	if result.Patient == nil {
		return nil, errors.New("enhancedbestmatchresult patient cannot be nil")
	}

	patientProto, err := PatientProtoFromAthenaPatient(*result.Patient)
	if err != nil {
		return nil, err
	}

	var scoreString string

	switch scoreValue := result.Score.(type) {
	case float64:
		scoreString = strconv.FormatFloat(scoreValue, 'f', -1, 64)
	case string:
		scoreString = scoreValue
	default:
		return nil, errors.New("unrecognizable Athena score format: " + fmt.Sprintf("%T", result.Score))
	}

	return &athenapb.EnhancedBestMatchResult{
		Patient:     patientProto,
		ScoreString: scoreString,
	}, nil
}

func PatientProtoFromAthenaPatient(patient Patient) (*athenapb.Patient, error) {
	dob, err := protoconv.DateProto(patient.DOB, dateLayout)
	if err != nil {
		return nil, err
	}

	contactInfo, err := contactInfoProtoFromAthenaPatient(patient)
	if err != nil {
		return nil, err
	}

	guarantor, err := athenaGuarantorToProto(patient.Guarantor)
	if err != nil {
		return nil, err
	}

	var portalAccessGiven *bool
	if patient.PortalAccessGiven != nil {
		portalAccessGiven = proto.Bool(*patient.PortalAccessGiven == stringTrue)
	}

	return &athenapb.Patient{
		PatientId:         patient.PatientID,
		Name:              nameProtoFromAthenaPatient(patient),
		DateOfBirth:       dob,
		Sex:               patient.Sex,
		ContactInfo:       contactInfo,
		EmergencyContact:  athenaEmergencyContactToProto(patient.EmergencyContact),
		Guarantor:         guarantor,
		DepartmentId:      patient.DepartmentID,
		PrimaryProviderId: patient.PrimaryProviderID,
		PortalAccessGiven: portalAccessGiven,
		BirthSex:          AthenaAssignedSexAtBirthToProtoSex(patient.BirthSex),
		GenderIdentity:    genderIdentityProtoFromAthenaPatient(patient),
	}, nil
}

func CareTeamMemberToProto(member *CareTeamMember) (*athenapb.CareTeamMember, error) {
	if member == nil {
		return nil, errNoCareTeamMember
	}

	phoneNumber, err := protoconv.PhoneNumberProto(member.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, errors.Wrap(err, "unable to parse care team memeber phone number")
	}

	return &athenapb.CareTeamMember{
		Address:            addressFromAthenaCareTeamMember(member),
		Name:               nameFromAthenaCareTeamMember(member),
		Phone:              phoneNumber,
		ClinicalProviderId: member.ClinicalProviderID,
		AnsiSpecialtyName:  member.AnsiSpecialtyName,
		Country:            member.Country,
		FacilityId:         member.FacilityID,
		MemberId:           member.MemberID,
		Npi:                member.NPI,
		ProviderId:         member.ProviderID,
		RecipientClass:     AthenaRecipientClassToProto(member.RecipientClass),
	}, nil
}

func nameProtoFromAthenaPatient(patient Patient) *commonpb.Name {
	if patient.Name == nil {
		return nil
	}
	name := patient.Name
	return &commonpb.Name{
		GivenName:           name.Firstname,
		FamilyName:          name.Lastname,
		MiddleNameOrInitial: name.Middlename,
		Suffix:              name.Suffix,
		PreferredName:       name.PreferredName,
	}
}

func addressProtoFromAthenaPatient(patient Patient) *commonpb.Address {
	if patient.Address == nil {
		return nil
	}
	address := patient.Address
	return &commonpb.Address{
		AddressLineOne: address.AddressLineOne,
		AddressLineTwo: address.AddressLineTwo,
		City:           address.City,
		State:          address.State,
		ZipCode:        address.ZipCode,
	}
}

func contactInfoProtoFromAthenaPatient(patient Patient) (*athenapb.ContactInfo, error) {
	if patient.ContactInfo == nil {
		return nil, nil
	}
	contact := patient.ContactInfo
	homePhone, err := protoconv.PhoneNumberProto(contact.HomePhone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, err
	}
	mobilePhone, err := protoconv.PhoneNumberProto(contact.MobilePhone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE)
	if err != nil {
		return nil, err
	}
	workPhone, err := protoconv.PhoneNumberProto(contact.WorkPhone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK)
	if err != nil {
		return nil, err
	}

	contactInfo := &athenapb.ContactInfo{
		HomeNumber:   homePhone,
		MobileNumber: mobilePhone,
		WorkNumber:   workPhone,
		Email:        contact.Email,
		Address:      addressProtoFromAthenaPatient(patient),
	}

	if proto.Equal(contactInfo, &athenapb.ContactInfo{}) {
		return nil, nil
	}

	return contactInfo, nil
}

func genderIdentityProtoFromAthenaPatient(patient Patient) *commonpb.GenderIdentity {
	if patient.GenderIdentity == nil {
		return nil
	}

	genderIdentityCategory, ok := athenaGenderIdentityToProto[*patient.GenderIdentity]
	if !ok {
		genderIdentityCategory = commonpb.GenderIdentity_CATEGORY_UNSPECIFIED
	}

	var otherDetails *string
	if genderIdentityCategory == commonpb.GenderIdentity_CATEGORY_OTHER {
		otherDetails = patient.GenderIdentityOther
	}

	return &commonpb.GenderIdentity{
		Category:     genderIdentityCategory,
		OtherDetails: otherDetails,
	}
}

func athenaGuarantorToProto(guarantor *Guarantor) (*athenapb.Guarantor, error) {
	if guarantor == nil {
		return nil, nil
	}
	guarantorDOB, err := protoconv.DateProto(guarantor.DOB, dateLayout)
	if err != nil {
		return nil, err
	}

	contactInfo, err := athenaContactInfoFromGuarantor(guarantor)
	if err != nil {
		return nil, err
	}

	var sameAddress *bool
	if guarantor.AddressSameAsPatient != nil {
		sameAddress = proto.Bool(*guarantor.AddressSameAsPatient == stringTrue)
	}

	return &athenapb.Guarantor{
		Name:                  nameFromAthenaGuarantor(guarantor),
		DateOfBirth:           guarantorDOB,
		ContactInfo:           contactInfo,
		RelationshipToPatient: guarantor.RelationshipToPatient,
		SameAddressAsPatient:  sameAddress,
	}, nil
}

func athenaContactInfoFromGuarantor(guarantor *Guarantor) (*athenapb.ContactInfo, error) {
	guarantorPhone, err := protoconv.PhoneNumberProto(guarantor.Phone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, err
	}

	contactInfo := &athenapb.ContactInfo{
		HomeNumber: guarantorPhone,
		Email:      guarantor.Email,
		Address:    addressFromAthenaGuarantor(guarantor),
	}
	if proto.Equal(contactInfo, &athenapb.ContactInfo{}) {
		return nil, nil
	}
	return contactInfo, nil
}

func athenaEmergencyContactToProto(contact *EmergencyContact) *athenapb.EmergencyContact {
	if contact == nil {
		return nil
	}
	return &athenapb.EmergencyContact{
		ContactName:         contact.Name,
		ContactRelationship: contact.Relationship,
		ContactMobilephone:  contact.MobilePhone,
	}
}

func PatientPreferredPharmaciesProtoFromAthena(pharmacies []Pharmacy) ([]*athenapb.Pharmacy, error) {
	var preferredPharmaciesProto []*athenapb.Pharmacy

	for _, pharmacy := range pharmacies {
		protoPharmacy, err := protoPharmacyFromAthena(pharmacy)
		if err != nil {
			return nil, err
		}
		preferredPharmaciesProto = append(preferredPharmaciesProto, protoPharmacy)
	}

	return preferredPharmaciesProto, nil
}

func PatientLabResultsProtoFromAthena(results []LabResult) ([]*athenapb.LabResult, error) {
	var err error
	labResultsProto := make([]*athenapb.LabResult, len(results))
	for i, result := range results {
		labResultsProto[i], err = protoLabResultFromAthena(result)
		if err != nil {
			return nil, err
		}
	}

	return labResultsProto, nil
}

func protoLabResultFromAthena(results LabResult) (*athenapb.LabResult, error) {
	analytesProto := make([]*athenapb.Analyte, len(results.Analytes))

	for i, analyte := range results.Analytes {
		analyteDate, err := protoconv.DateProto(analyte.Date, dateLayout)
		if err != nil {
			return nil, err
		}

		analyteDateTime, err := protoconv.DateTimeProto(analyte.DateTime, dateTimeLayout)
		if err != nil {
			return nil, err
		}

		analytesProto[i] = &athenapb.Analyte{
			ObservationIdentifier: analyte.ObservationIdentifier,
			ResultStatus:          analyte.ResultStatus,
			Name:                  analyte.Name,
			DateTime:              analyteDateTime,
			Date:                  analyteDate,
			Value:                 analyte.Value,
			Description:           analyte.Description,
			Loinc:                 analyte.LoInc,
			Note:                  analyte.Note,
			Id:                    analyte.ID,
		}
	}

	address := &commonpb.Address{
		AddressLineOne: results.PerformingLabAddress1,
		City:           results.PerformingLabCity,
		State:          results.PerformingLabState,
		ZipCode:        results.PerformingLabZIP,
	}

	var err error
	var date *commonpb.Date
	var dateTime *commonpb.DateTime

	if results.Date != nil {
		date, err = protoconv.DateProto(results.Date, dateLayout)
		if err != nil {
			return nil, err
		}
	}

	if results.DateTime != nil {
		dateTime, err = protoconv.DateTimeProto(results.DateTime, dateTimeLayout)
		if err != nil {
			return nil, err
		}
	}

	isReviewedByProvider, err := strconv.ParseBool(results.IsReviewedByProvider)
	if err != nil {
		return nil, err
	}

	attachmentExists, err := strconv.ParseBool(results.AttachmentExists)
	if err != nil {
		return nil, err
	}

	return &athenapb.LabResult{
		Priority:             results.Priority,
		Date:                 date,
		ResultStatus:         results.ResultStatus,
		IsReviewedByProvider: &isReviewedByProvider,
		PerformingLabAddress: address,
		Id:                   results.ID,
		PerformingLabName:    results.PerformingLabName,
		DateTime:             dateTime,
		Analytes:             analytesProto,
		FacilityId:           results.FacilityID,
		Description:          results.Description,
		AttachmentExists:     &attachmentExists,
		Loinc:                results.LoInc,
	}, err
}

func PatientDefaultPharmacyProtoFromAthena(pharmacy Pharmacy) (*athenapb.Pharmacy, error) {
	protoPharmacy, err := protoPharmacyFromAthena(pharmacy)
	if err != nil {
		return nil, err
	}
	return protoPharmacy, nil
}

func protoPharmacyFromAthena(pharmacy Pharmacy) (*athenapb.Pharmacy, error) {
	phoneNumber, err := protoconv.PhoneNumberProto(pharmacy.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK)
	if err != nil {
		return nil, errors.Wrap(err, "unable to parse pharmacy phone number")
	}
	return &athenapb.Pharmacy{
		PharmacyType:    pharmacy.PharmacyType,
		DefaultPharmacy: pharmacy.DefaultPharmacy,
		Address: &commonpb.Address{
			AddressLineOne: pharmacy.Address1,
			AddressLineTwo: pharmacy.Address2,
			City:           pharmacy.City,
			State:          pharmacy.State,
			ZipCode:        pharmacy.Zip,
		},
		ReceiverType: pharmacy.ReceiverType,
		AcceptFax:    pharmacy.AcceptFax,
		ClinicalProvider: &athenapb.ClinicalProvider{
			Id:   pharmacy.ClinicalProviderID,
			Name: pharmacy.ClinicalProviderName,
		},
		PhoneNumber: phoneNumber,
		FaxNumber:   pharmacy.FaxNumber,
	}, nil
}

func addressFromAthenaGuarantor(guarantor *Guarantor) *commonpb.Address {
	if guarantor == nil {
		return nil
	}
	address := &commonpb.Address{
		AddressLineOne: guarantor.AddressLineOne,
		AddressLineTwo: guarantor.AddressLineTwo,
		City:           guarantor.City,
		State:          guarantor.State,
		ZipCode:        guarantor.ZipCode,
	}
	if proto.Equal(address, &commonpb.Address{}) {
		return nil
	}
	return address
}

func addressFromAthenaCareTeamMember(member *CareTeamMember) *commonpb.Address {
	if member.Address1 == nil && member.Address2 == nil && member.City == nil && member.State == nil && member.Zip == nil {
		return nil
	}
	return &commonpb.Address{
		AddressLineOne: member.Address1,
		AddressLineTwo: member.Address2,
		City:           member.City,
		State:          member.State,
		ZipCode:        member.Zip,
	}
}

func nameFromAthenaGuarantor(guarantor *Guarantor) *commonpb.Name {
	if guarantor == nil {
		return nil
	}
	name := &commonpb.Name{
		GivenName:           guarantor.Firstname,
		FamilyName:          guarantor.Lastname,
		Suffix:              guarantor.Suffix,
		MiddleNameOrInitial: guarantor.Middlename,
	}
	if proto.Equal(name, &commonpb.Name{}) {
		return nil
	}
	return name
}

func nameFromAthenaCareTeamMember(member *CareTeamMember) *commonpb.Name {
	return &commonpb.Name{
		GivenName:           member.FirstName,
		FamilyName:          member.LastName,
		MiddleNameOrInitial: member.MiddleName,
		Suffix:              member.Suffix,
		PreferredName:       member.PreferredName,
	}
}

func AthenaRecipientClassToProto(recipientClass *RecipientClass) *athenapb.RecipientClass {
	if recipientClass == nil {
		return nil
	}
	return &athenapb.RecipientClass{
		Code:        recipientClass.Code,
		Description: recipientClass.Description,
	}
}

func PatientFromPatientProto(patient *athenapb.Patient) (*Patient, error) {
	athenaPatient := &Patient{
		DOB:               protoconv.ProtoDateToString(patient.DateOfBirth, dateLayout),
		Sex:               patient.Sex,
		BirthSex:          ProtoSexToAthenaAssignedSexAtBirth(patient.BirthSex),
		DepartmentID:      patient.DepartmentId,
		PrimaryProviderID: patient.PrimaryProviderId,
		Name:              patientNameFromProto(patient.Name),
		ContactInfo:       contactInfoFromProto(patient.ContactInfo),
		Address:           addressFromProto(patient.ContactInfo),
		EmergencyContact:  emergencyContactFromProto(patient.EmergencyContact),
		Guarantor:         guarantorFromProto(patient.Guarantor),
	}

	if patient.PortalAccessGiven != nil {
		accessGiven := strconv.FormatBool(*patient.PortalAccessGiven)
		athenaPatient.PortalAccessGiven = &accessGiven
	}

	if patient.GenderIdentity != nil {
		genderIdentity, ok := genderIdentityCategoryToAthenaGenderIdentity[patient.GenderIdentity.Category]
		if ok {
			athenaPatient.GenderIdentity = &genderIdentity
		}
		athenaPatient.GenderIdentityOther = patient.GenderIdentity.OtherDetails
	}

	return athenaPatient, nil
}

func patientNameFromProto(name *commonpb.Name) *Name {
	if name == nil {
		return nil
	}
	return &Name{
		Firstname:     name.GivenName,
		Lastname:      name.FamilyName,
		Middlename:    name.MiddleNameOrInitial,
		PreferredName: name.PreferredName,
		Suffix:        name.Suffix,
	}
}

func contactInfoFromProto(contactInfo *athenapb.ContactInfo) *ContactInfo {
	if contactInfo == nil {
		return nil
	}
	contact := &ContactInfo{
		Email: contactInfo.Email,
	}
	if contactInfo.HomeNumber != nil {
		contact.HomePhone = contactInfo.HomeNumber.PhoneNumber
	}
	if contactInfo.MobileNumber != nil {
		contact.MobilePhone = contactInfo.MobileNumber.PhoneNumber
	}
	if contactInfo.WorkNumber != nil {
		contact.WorkPhone = contactInfo.WorkNumber.PhoneNumber
	}
	return contact
}

func addressFromProto(contactInfo *athenapb.ContactInfo) *Address {
	if contactInfo == nil || contactInfo.Address == nil {
		return nil
	}
	protoAddress := contactInfo.Address
	address := &Address{
		AddressLineOne: protoAddress.AddressLineOne,
		AddressLineTwo: protoAddress.AddressLineTwo,
		City:           protoAddress.City,
		State:          protoAddress.State,
		ZipCode:        protoAddress.ZipCode,
	}
	return address
}

func emergencyContactFromProto(contact *athenapb.EmergencyContact) *EmergencyContact {
	if contact == nil {
		return nil
	}
	return &EmergencyContact{
		Name:         contact.ContactName,
		Relationship: contact.ContactRelationship,
		MobilePhone:  contact.ContactMobilephone,
	}
}

func guarantorFromProto(guarantor *athenapb.Guarantor) *Guarantor {
	if guarantor == nil {
		return nil
	}
	patientGuarantor := &Guarantor{
		RelationshipToPatient: guarantor.RelationshipToPatient,
		DOB:                   protoconv.ProtoDateToString(guarantor.DateOfBirth, dateLayout),
	}
	if guarantor.Name != nil {
		patientGuarantor.Firstname = guarantor.Name.GivenName
		patientGuarantor.Middlename = guarantor.Name.MiddleNameOrInitial
		patientGuarantor.Lastname = guarantor.Name.FamilyName
		patientGuarantor.Suffix = guarantor.Name.Suffix
	}

	if guarantor.ContactInfo != nil {
		patientGuarantor.Email = guarantor.ContactInfo.Email
		if guarantor.ContactInfo.HomeNumber != nil {
			patientGuarantor.Phone = guarantor.ContactInfo.HomeNumber.PhoneNumber
		}
		if guarantor.ContactInfo.Address != nil {
			patientGuarantor.City = guarantor.ContactInfo.Address.City
			patientGuarantor.State = guarantor.ContactInfo.Address.State
			patientGuarantor.ZipCode = guarantor.ContactInfo.Address.ZipCode
			patientGuarantor.AddressLineOne = guarantor.ContactInfo.Address.AddressLineOne
			patientGuarantor.AddressLineTwo = guarantor.ContactInfo.Address.AddressLineTwo
		}
	}
	if guarantor.SameAddressAsPatient != nil {
		sameAsPatient := strconv.FormatBool(*guarantor.SameAddressAsPatient)
		patientGuarantor.AddressSameAsPatient = &sameAsPatient
	}
	return patientGuarantor
}

// StructToURLValues converts a struct into url.Values using the field tag (tagname param) value as the encoded field name.
func StructToURLValues(i any, tagname string) url.Values {
	values := url.Values{}
	if i == nil {
		return values
	}
	iVal := reflect.ValueOf(i).Elem()
	buildURLValues(iVal, values, tagname)

	return values
}

func buildURLValues(value reflect.Value, values url.Values, tagname string) {
	embedded := []reflect.Value{}
	typ := value.Type()
	for i := 0; i < value.NumField(); i++ {
		field := typ.Field(i).Name
		tag := typ.Field(i).Tag.Get(tagname)
		if tag != "" {
			s := strings.Split(tag, ",")
			if s[0] == "-" {
				continue
			}
			if slices.Contains(s[1:], "omitempty") && value.Field(i).IsZero() {
				continue
			}
			field = s[0]
		}

		fieldValue := value.Field(i)
		var resolvedValue reflect.Value
		if fieldValue.Kind() == reflect.Ptr {
			if fieldValue.IsNil() {
				continue
			}
			if fieldValue.Elem().Kind() == reflect.Struct {
				embedded = append(embedded, reflect.Indirect(fieldValue))
				continue
			}
			resolvedValue = fieldValue.Elem()
		} else {
			if fieldValue.Kind() == reflect.Struct {
				continue
			}
			resolvedValue = fieldValue
		}

		values.Set(field, fmt.Sprint(resolvedValue))
	}
	for _, v := range embedded {
		buildURLValues(v, values, tagname)
	}
}

func PatientInsuranceProtoFromAthenaPatientInsurance(insuranceRecord *PatientInsurance) (*athenapb.Insurance, error) {
	packageID, err := protoconv.ProtoStringToInt64(insuranceRecord.InsurancePackageID)
	if err != nil {
		return nil, err
	}
	groupID, err := protoconv.ProtoStringToInt64(insuranceRecord.PolicyNumber)
	if err != nil {
		return nil, err
	}
	insuranceHolder, err := insuranceHolderProtoFromAthenaInsuranceHolder(insuranceRecord.InsuranceHolder)
	if err != nil {
		return nil, err
	}
	return &athenapb.Insurance{
		DepartmentId:           insuranceRecord.DepartmentID,
		MemberId:               insuranceRecord.InsuranceID,
		PackageId:              packageID,
		GroupId:                groupID,
		PrimaryInsuranceHolder: insuranceHolder,
		InsuranceId:            insuranceRecord.AthenaInsuranceID,
	}, nil
}

func insuranceHolderProtoFromAthenaInsuranceHolder(insuranceHolder *InsuranceHolder) (*athenapb.PrimaryInsuranceHolder, error) {
	if insuranceHolder == nil {
		return nil, nil
	}
	dob, err := protoconv.DateProto(insuranceHolder.DOB, dateLayout)
	if err != nil {
		return nil, err
	}
	relationshipToInsuredID, err := athenaRelationShipToInsuredIDToProto(insuranceHolder.RelationshipToPolicyHolder)
	if err != nil {
		return nil, err
	}
	return &athenapb.PrimaryInsuranceHolder{
		Name:        insuranceHolderNameProtoFromAthenaInsuranceHolderName(insuranceHolder.InsuranceHolderName),
		DateOfBirth: dob,
		Sex:         athenaGenderToProto(insuranceHolder.Sex),
		Relation:    relationshipToInsuredID,
	}, nil
}

func PatientInsuranceRecordFromInsuranceProto(insurance *athenapb.Insurance) *PatientInsurance {
	return &PatientInsurance{
		DepartmentID:       insurance.DepartmentId,
		InsuranceID:        insurance.MemberId,
		InsurancePackageID: protoconv.ProtoInt64ToString(insurance.PackageId),
		PolicyNumber:       protoconv.ProtoInt64ToString(insurance.GroupId),
		UpdateAppointments: protoconv.ProtoBoolToString(insurance.UpdateAppointments),
		InsuranceHolder:    insuranceHolderFromProto(insurance.PrimaryInsuranceHolder),
	}
}

func insuranceHolderFromProto(holder *athenapb.PrimaryInsuranceHolder) *InsuranceHolder {
	if holder == nil {
		return nil
	}
	relationship := strconv.Itoa(int(holder.GetRelation().Number()))
	sex := holder.GetSex()
	insuranceHolderName := insuranceHolderNameFromProto(holder.Name)
	return &InsuranceHolder{
		InsuranceHolderName:        insuranceHolderName,
		DOB:                        protoconv.ProtoDateToString(holder.GetDateOfBirth(), dateLayout),
		Sex:                        ProtoGenderToAthenaGender(&sex),
		RelationshipToPolicyHolder: proto.String(relationship),
	}
}

func insuranceHolderNameFromProto(name *commonpb.Name) *InsuranceHolderName {
	if name == nil {
		return nil
	}
	return &InsuranceHolderName{
		FirstName:  name.GivenName,
		MiddleName: name.MiddleNameOrInitial,
		LastName:   name.FamilyName,
	}
}

func insuranceHolderNameProtoFromAthenaInsuranceHolderName(name *InsuranceHolderName) *commonpb.Name {
	if name == nil {
		return nil
	}
	return &commonpb.Name{
		GivenName:           name.FirstName,
		MiddleNameOrInitial: name.MiddleName,
		FamilyName:          name.LastName,
	}
}

func ProtoGenderToAthenaGender(sex *commonpb.Sex) *string {
	if sex == nil {
		return nil
	}

	athenaSex, ok := protoSexToAthenaSex[*sex]
	if !ok {
		return nil
	}

	return athenaSex
}

func ProtoSexToAthenaAssignedSexAtBirth(sex *commonpb.BirthSex) *string {
	if sex == nil {
		return nil
	}

	birthSex, ok := protoSexToAthenaBirthSex[*sex]
	if !ok {
		return nil
	}

	return birthSex
}

func AthenaAssignedSexAtBirthToProtoSex(birthSex *string) *commonpb.BirthSex {
	if birthSex == nil {
		return nil
	}

	sex, ok := athenaBirthSexToProto[*birthSex]
	if !ok {
		return nil
	}

	return &sex
}

func athenaGenderToProto(sex *string) *commonpb.Sex {
	if sex == nil {
		return nil
	}

	protoSex, ok := athenaSexToProto[*sex]
	if !ok {
		return nil
	}

	return &protoSex
}

func athenaRelationShipToInsuredIDToProto(relationshipID *string) (*athenapb.RelationToPatient, error) {
	if relationshipID == nil {
		return nil, nil
	}
	id, err := strconv.ParseInt(*relationshipID, 10, 32)
	if err != nil {
		return nil, err
	}
	if _, ok := athenapb.RelationToPatient_name[int32(id)]; !ok {
		return nil, fmt.Errorf("relationship with ID %s not found in RelationToPatient map", *relationshipID)
	}
	relationID := athenapb.RelationToPatient(int32(id))
	return &relationID, nil
}

func ClinicalProviderToProto(clinicalProvider *ClinicalProvider) (*athenapb.ClinicalProviderSearchResult, error) {
	if clinicalProvider == nil {
		return nil, errNoClinicalProvider
	}

	faxNumber, err := protoconv.PhoneNumberProto(clinicalProvider.FaxNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, errors.Wrap(err, "unable to parse clinical provider fax number")
	}

	phoneNumber, err := protoconv.PhoneNumberProto(clinicalProvider.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, errors.Wrap(err, "unable to parse clinical provider phone number")
	}

	distance, err := strconv.ParseFloat(*clinicalProvider.Distance, strconv.IntSize)
	if err != nil {
		return nil, errors.Wrap(err, "unable to parse distance")
	}

	return &athenapb.ClinicalProviderSearchResult{
		ClinicalProviderId: clinicalProvider.ID,
		ProviderName:       nameFromAthenaClinicalProvider(clinicalProvider),
		Address:            addressFromAthenaClinicalProvider(clinicalProvider),
		Distance:           proto.Float64(distance),
		FaxNumber:          faxNumber,
		PhoneNumber:        phoneNumber,
		NcpdpId:            clinicalProvider.NCPDID,
		PharmacyType:       clinicalProvider.PharmacyType,
		OrganizationName:   clinicalProvider.Name,
	}, nil
}

func ProtoToClinicalProvider(request *athenapb.SearchClinicalProvidersRequest) (*ClinicalProvider, error) {
	if request == nil {
		return nil, errNoClinicalProviderProto
	}

	faxNumber, err := phoneNumberFromProto(request.FaxNumber)
	if err != nil {
		return nil, err
	}

	phoneNumber, err := phoneNumberFromProto(request.PhoneNumber)
	if err != nil {
		return nil, err
	}

	distance := strconv.Itoa(int(request.Distance))

	return &ClinicalProvider{
		Name:        proto.String(request.Name),
		FirstName:   proto.String(request.FirstName),
		LastName:    proto.String(request.LastName),
		City:        proto.String(request.City),
		State:       proto.String(request.State),
		Zip:         proto.String(request.Zip),
		Address:     addressProtoToAddress(request.Address),
		Distance:    proto.String(distance),
		PhoneNumber: phoneNumber,
		FaxNumber:   faxNumber,
		NPI:         proto.String(request.Npi),
		OrderType:   orderTypeProtoToOrderType(&request.OrderType),
	}, nil
}

func nameFromAthenaClinicalProvider(clinicalProvider *ClinicalProvider) *commonpb.Name {
	return &commonpb.Name{
		GivenName:  clinicalProvider.FirstName,
		FamilyName: clinicalProvider.LastName,
	}
}

func addressFromAthenaClinicalProvider(clinicalProvider *ClinicalProvider) *commonpb.Address {
	return &commonpb.Address{
		AddressLineOne: clinicalProvider.Address,
		City:           clinicalProvider.City,
		State:          clinicalProvider.State,
		ZipCode:        clinicalProvider.Zip,
	}
}

func phoneNumberFromProto(phoneNumber *commonpb.PhoneNumber) (*string, error) {
	if phoneNumber == nil {
		return nil, nil
	}

	num, err := phonenumbers.Parse(*phoneNumber.PhoneNumber, usPhoneNumberRegionCode)
	if err != nil {
		return nil, err
	}
	return proto.String(phonenumbers.Format(num, phonenumbers.NATIONAL)), nil
}

func addressProtoToAddress(address *commonpb.Address) *string {
	if address == nil {
		return nil
	}

	return address.AddressLineOne
}

var orderTypes = map[athenapb.OrderType]string{
	athenapb.OrderType_ORDER_TYPE_DME:           "DME",
	athenapb.OrderType_ORDER_TYPE_IMAGING:       "IMAGING",
	athenapb.OrderType_ORDER_TYPE_LAB:           "LAB",
	athenapb.OrderType_ORDER_TYPE_OTHER:         "OTHER",
	athenapb.OrderType_ORDER_TYPE_PRESCRIPTION:  "PRESCRIPTION",
	athenapb.OrderType_ORDER_TYPE_PROCEDURE:     "PROCEDURE",
	athenapb.OrderType_ORDER_TYPE_SURGERY:       "SURGERY",
	athenapb.OrderType_ORDER_TYPE_VACCINE:       "VACCINE",
	athenapb.OrderType_ORDER_TYPE_CONSULTANT:    "CONSULTANT",
	athenapb.OrderType_ORDER_TYPE_GLASSES:       "GLASSES",
	athenapb.OrderType_ORDER_TYPE_CONTACTLENSES: "CONTACTLENSES",
}

func orderTypeProtoToOrderType(orderType *athenapb.OrderType) *string {
	if orderType == nil {
		return nil
	}

	order, ok := orderTypes[*orderType]
	if !ok {
		return nil
	}

	return &order
}

func StatusChangeSubscriptionToEnum(statusStr string) athenapb.StatusChangeSubscription {
	switch strings.ToUpper(statusStr) {
	case "ACTIVE":
		return athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE
	case "INACTIVE":
		return athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE
	case "PARTIAL":
		return athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL
	default:
		return athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_UNSPECIFIED
	}
}

func nameProtoFromAthenaSearchPatientResult(patient *SearchPatientResult) *commonpb.Name {
	return &commonpb.Name{
		GivenName:           patient.FirstName,
		FamilyName:          patient.LastName,
		MiddleNameOrInitial: patient.MiddleInitial,
		Suffix:              patient.NameSuffix,
	}
}

func addressFromAthenaSearchPatientResult(patient *SearchPatientResult) *commonpb.Address {
	if patient.Address1 == nil && patient.City == nil && patient.State == nil && patient.Zip == nil {
		return nil
	}
	return &commonpb.Address{
		AddressLineOne: patient.Address1,
		AddressLineTwo: patient.Address2,
		City:           patient.City,
		State:          patient.State,
		ZipCode:        patient.Zip,
	}
}

func phoneNumberFromAthenaSearchPatientResult(patient *SearchPatientResult) *commonpb.PhoneNumber {
	if patient.HomePhone == nil && patient.CountryID == nil {
		return nil
	}

	countryCode, err := strconv.ParseInt(*patient.CountryID, 10, 32)
	if err != nil {
		return nil
	}

	return &commonpb.PhoneNumber{
		PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
		CountryCode:     proto.Int32(int32(countryCode)),
		PhoneNumber:     patient.HomePhone,
	}
}

func contactInfoFromAthenaSearchPatientResult(patient *SearchPatientResult) *athenapb.ContactInfo {
	return &athenapb.ContactInfo{
		HomeNumber: phoneNumberFromAthenaSearchPatientResult(patient),
		Address:    addressFromAthenaSearchPatientResult(patient),
	}
}

func SearchPatientResultToProto(result *SearchPatientResult) (*athenapb.SearchPatientsResult, error) {
	if result == nil {
		return nil, errNoSearchPatientResult
	}

	dob, err := protoconv.DateProto(result.DOB, dateLayout)
	if err != nil {
		return nil, err
	}

	return &athenapb.SearchPatientsResult{
		Patient: &athenapb.Patient{
			PatientId:    result.PatientID,
			Name:         nameProtoFromAthenaSearchPatientResult(result),
			DateOfBirth:  dob,
			Sex:          result.Sex,
			ContactInfo:  contactInfoFromAthenaSearchPatientResult(result),
			DepartmentId: result.CurrentDepartmentID,
		},
	}, nil
}

func GenerateNotesFromAnalytes(labResultID string, analytes []*athenapb.Analyte) (string, error) {
	var sb strings.Builder
	sb.WriteString(`<h3 id="lab-result-id-` + labResultID + `">Lab Results</h3>`)
	sb.WriteString("<ul>")
	for _, analyte := range analytes {
		if analyte.Name != nil && analyte.Value != nil && analyte.Units != nil {
			sb.WriteString(fmt.Sprintf("<li>%s: %s%s</li>", analyte.GetName(), analyte.GetValue(), analyte.GetUnits()))
		} else {
			log.Printf("required field in Analyte struct is empty: Name: %s, Value: %s, Units: %s", analyte.GetName(), analyte.GetValue(), analyte.GetUnits())
		}
	}
	sb.WriteString("</ul>")
	return sb.String(), nil
}

func PatientLabResultDocumentProtoFromAthena(results []LabResultDocument) ([]*athenapb.LabResultDocument, error) {
	var err error
	labResultDocumentProto := make([]*athenapb.LabResultDocument, len(results))
	for i, result := range results {
		labResultDocumentProto[i], err = protoLabResultDocumentFromAthena(result)
		if err != nil {
			return nil, err
		}
	}

	return labResultDocumentProto, nil
}

func protoLabResultDocumentFromAthena(results LabResultDocument) (*athenapb.LabResultDocument, error) {
	analytesProto := make([]*athenapb.Analyte, len(results.Observations))

	for i, analyte := range results.Observations {
		analytesProto[i] = &athenapb.Analyte{
			ObservationIdentifier: analyte.ObservationIdentifier,
			ResultStatus:          analyte.ResultStatus,
			Name:                  analyte.Name,
			Value:                 analyte.Value,
			Units:                 analyte.Units,
			Description:           analyte.Description,
			Loinc:                 analyte.LoInc,
			Note:                  analyte.Note,
			Id:                    analyte.ID,
		}
	}

	var err error
	var encounterDate *commonpb.Date
	var observationDateTime *commonpb.DateTime
	var isConfidential bool

	if results.EncounterDate != nil {
		encounterDate, err = protoconv.DateProto(results.EncounterDate, dateLayout)
		if err != nil {
			return nil, err
		}
	}

	if results.ObservationDateTime != nil {
		observationDateTime, err = protoconv.DateTimeProto(results.ObservationDateTime, time.RFC3339)
		if err != nil {
			return nil, err
		}
	}

	if results.IsConfidential != nil {
		isConfidential, err = strconv.ParseBool(*results.IsConfidential)
		if err != nil {
			return nil, err
		}
	}

	return &athenapb.LabResultDocument{
		DepartmentId:        results.DepartmentID,
		DocumentRoute:       results.DocumentRoute,
		DocumentSource:      results.DocumentSource,
		DocumentTypeId:      results.DocumentTypeID,
		EncounterDate:       encounterDate,
		EncounterId:         results.EncounterID,
		FacilityId:          results.FacilityID,
		IsConfidential:      &isConfidential,
		Id:                  results.ID,
		Loinc:               results.Loinc,
		ObservationDateTime: observationDateTime,
		Observations:        analytesProto,
		ProviderId:          results.ProviderID,
		OrderId:             results.OrderID,
	}, err
}

func InsuranceBenefitDetailsToProto(insuranceDetails PatientInsuranceBenefitDetails) (*athenapb.InsuranceBenefitDetails, error) {
	dateOfService, err := protoconv.DateProto(insuranceDetails.DateOfService, dateLayout)
	if err != nil {
		return nil, err
	}
	lastCheckDate, err := protoconv.DateProto(insuranceDetails.LastCheckDate, dateLayout)
	if err != nil {
		return nil, err
	}

	return &athenapb.InsuranceBenefitDetails{
		EligibilityData: *insuranceDetails.EligibilityData,
		DateOfService:   dateOfService,
		LastCheckDate:   lastCheckDate,
	}, nil
}
