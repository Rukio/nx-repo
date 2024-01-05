package patientconv

import (
	"strconv"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_eligibility"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
)

var (
	errNoStationInsurance   = errors.New("station insurance cannot be nil")
	errNoStationInsuranceID = errors.New("station insurance requires id")
	errNoStationMemberID    = errors.New("station insurance requires member id")
	errNoStationPriority    = errors.New("station insurance requires priority")

	errNoInsuranceProto = errors.New("insurance proto cannot be nil")
	errNoPriorityProto  = errors.New("insurance priority cannot be nil")
)

func StationInsuranceToProto(stationInsurance *patient.StationInsuranceWithURL) (*patientspb.InsuranceRecord, error) {
	if stationInsurance == nil {
		return nil, errNoStationInsurance
	}

	if stationInsurance.ID == nil {
		return nil, errNoStationInsuranceID
	}

	if stationInsurance.PatientID == nil {
		return nil, errNoStationPatientID
	}

	if stationInsurance.MemberID == nil {
		return nil, errNoStationMemberID
	}

	if stationInsurance.Priority == nil {
		return nil, errNoStationPriority
	}

	updatedAt, err := timestampProto(stationInsurance.UpdatedAt)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse updated at timestamp")
	}

	return &patientspb.InsuranceRecord{
		Id:                     proto.String(strconv.FormatInt(*stationInsurance.ID, 10)),
		PatientId:              proto.String(strconv.FormatInt(*stationInsurance.PatientID, 10)),
		Priority:               priorityProto(stationInsurance.Priority),
		MemberId:               stationInsurance.MemberID,
		GroupId:                stationInsurance.GroupNumber,
		PrimaryInsuranceHolder: primaryInsuranceHolderProto(stationInsurance.PrimaryInsuranceHolder),
		EligibilityStatus:      eligibilityStatusProto(stationInsurance.Eligible),
		EligibilityMessage:     stationInsurance.EligibilityMessage,
		Images:                 insuranceImageProto(stationInsurance),
		UpdatedAt:              updatedAt,
		CompanyName:            stationInsurance.CompanyName,
		PackageId:              stationInsurance.PackageID,
		InsurancePlanId:        stationInsurance.InsurancePlanID,
	}, nil
}

func ProtoToStationInsurance(insuranceProto *patientspb.InsuranceRecord) (*patient.StationInsuranceWithRawImage, error) {
	if insuranceProto == nil {
		return nil, errNoInsuranceProto
	}

	if insuranceProto.GetPatientId() == "" {
		return nil, errors.New("patient ID cannot be nil")
	}

	patientID, err := parseInt(insuranceProto.GetPatientId())
	if err != nil {
		return nil, errors.Wrap(err, "cannot parse insurance proto patient id")
	}

	var insuranceID *int64
	if insuranceProto.Id != nil {
		insuranceID, err = parseInt(insuranceProto.GetId())
		if err != nil {
			return nil, errors.Wrap(err, "cannot parse insurance proto ID")
		}
	}

	priority, err := stationInsurancePriority(insuranceProto.Priority)
	if err != nil {
		return nil, errors.Wrap(err, "failed insurance priority is not defined")
	}

	return &patient.StationInsuranceWithRawImage{
		StationInsurance: patient.StationInsurance{
			ID:                     insuranceID,
			PatientID:              patientID,
			Priority:               priority,
			MemberID:               insuranceProto.MemberId,
			GroupNumber:            insuranceProto.GroupId,
			Eligible:               stationEligibleStatus(insuranceProto.EligibilityStatus),
			EligibilityMessage:     insuranceProto.EligibilityMessage,
			UpdatedAt:              stationTimestamp(insuranceProto.UpdatedAt),
			PrimaryInsuranceHolder: stationPrimaryInsuranceHolder(insuranceProto.PrimaryInsuranceHolder),
			CompanyName:            insuranceProto.CompanyName,
			PackageID:              insuranceProto.PackageId,
			InsurancePlanID:        insuranceProto.InsurancePlanId,
			InsuredSameAsPatient:   insuredSameAsPatient(insuranceProto),
			// TODO(PT-1725): Determine whether patient relation to subscriber even needs to exist
			PatientRelationToSubscriber: proto.String(patientRelationToSubscriber(insuranceProto)),
		},
		CardFront: stationInsuranceCard(insuranceProto.Images, patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT),
		CardBack:  stationInsuranceCard(insuranceProto.Images, patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK),
	}, nil
}

func patientRelationToSubscriber(insuranceProto *patientspb.InsuranceRecord) string {
	if insuredSameAsPatient(insuranceProto) {
		return "patient"
	}
	return "other"
}

func insuredSameAsPatient(insuranceProto *patientspb.InsuranceRecord) bool {
	return insuranceProto.GetPrimaryInsuranceHolder().GetPatientRelationToSubscriber() == patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT
}

func primaryInsuranceHolderProto(insuranceHolder *patient.StationPrimaryInsuranceHolder) *patientspb.PrimaryInsuranceHolder {
	if insuranceHolder == nil {
		return nil
	}

	return &patientspb.PrimaryInsuranceHolder{
		Name:                        primaryInsuranceHolderNameProto(insuranceHolder),
		Sex:                         sexProto(insuranceHolder.Gender),
		PatientRelationToSubscriber: patientRelationToSubscriberProto(insuranceHolder.PatientRelationshipToInsured),
	}
}

var insurancePriorities = map[string]patientspb.InsurancePriority{
	"1": patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
	"2": patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY,
	"3": patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY,
	"":  patientspb.InsurancePriority_INSURANCE_PRIORITY_UNSPECIFIED,
}

func priorityProto(priority *string) patientspb.InsurancePriority {
	insurancePriority, ok := insurancePriorities[*priority]
	if !ok {
		return patientspb.InsurancePriority_INSURANCE_PRIORITY_UNSPECIFIED
	}
	return insurancePriority
}

func primaryInsuranceHolderNameProto(insuranceHolder *patient.StationPrimaryInsuranceHolder) *commonpb.Name {
	if insuranceHolder.StationPrimaryInsuranceHolderName == nil {
		return nil
	}

	nameProto := commonpb.Name{
		GivenName:           insuranceHolder.FirstName,
		MiddleNameOrInitial: insuranceHolder.MiddleInitial,
		FamilyName:          insuranceHolder.LastName,
	}
	if proto.Equal(&nameProto, &emptyName) {
		return nil
	}

	return &nameProto
}

var eligibilityStatuses = map[string]insurance_eligibility.EligibilityStatus{
	"Eligible":   insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
	"Ineligible": insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_INELIGIBLE,
	"Unverified": insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNVERIFIED,
	"":           insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNSPECIFIED,
}

func eligibilityStatusProto(status *string) insurance_eligibility.EligibilityStatus {
	if status == nil {
		return insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNSPECIFIED
	}

	eligibilityStatus, ok := eligibilityStatuses[*status]
	if !ok {
		return insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNSPECIFIED
	}
	return eligibilityStatus
}

func insuranceImageProto(stationInsurance *patient.StationInsuranceWithURL) map[int32]*patientspb.InsuranceImage {
	if stationInsurance.CardFront == nil && stationInsurance.CardBack == nil {
		return nil
	}

	if stationInsurance.CardFront.URL == nil && stationInsurance.CardBack.URL == nil {
		return nil
	}

	images := make(map[int32]*patientspb.InsuranceImage)

	requiresVerification := false
	if stationInsurance.ImageRequiresVerification != nil {
		requiresVerification = *stationInsurance.ImageRequiresVerification
	}

	if stationInsurance.CardFront != nil {
		images[int32(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT)] = &patientspb.InsuranceImage{
			ImageUrl:  stationInsurance.CardFront.URL,
			ImageType: patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum(),
			Verified:  requiresVerification,
		}
	}

	if stationInsurance.CardBack != nil {
		images[int32(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK)] = &patientspb.InsuranceImage{
			ImageUrl:  stationInsurance.CardBack.URL,
			ImageType: patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum(),
			Verified:  requiresVerification,
		}
	}

	return images
}

var insuranceStringPriorities = map[patientspb.InsurancePriority]string{
	patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY:   "1",
	patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY: "2",
	patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY:  "3",
}

func stationInsurancePriority(insurancePriority patientspb.InsurancePriority) (*string, error) {
	priority, ok := insuranceStringPriorities[insurancePriority]
	if !ok {
		return nil, errNoPriorityProto
	}

	return proto.String(priority), nil
}

func stationPrimaryInsuranceHolder(insuranceHolder *patientspb.PrimaryInsuranceHolder) *patient.StationPrimaryInsuranceHolder {
	if insuranceHolder == nil {
		return nil
	}

	return &patient.StationPrimaryInsuranceHolder{
		StationPrimaryInsuranceHolderName: stationPrimaryInsuranceName(insuranceHolder.Name),
		Gender:                            stationGender(insuranceHolder.Sex),
		PatientRelationshipToInsured:      stationRelationshipToInsured(insuranceHolder.GetPatientRelationToSubscriber()),
	}
}

func stationPrimaryInsuranceName(name *commonpb.Name) *patient.StationPrimaryInsuranceHolderName {
	if name == nil {
		return nil
	}

	return &patient.StationPrimaryInsuranceHolderName{
		FirstName:     name.GivenName,
		MiddleInitial: name.MiddleNameOrInitial,
		LastName:      name.FamilyName,
	}
}

var eligibilityStringStatuses = map[insurance_eligibility.EligibilityStatus]string{
	insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE:    "Eligible",
	insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_INELIGIBLE:  "Ineligible",
	insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNVERIFIED:  "Unverified",
	insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_UNSPECIFIED: "",
}

func stationEligibleStatus(status insurance_eligibility.EligibilityStatus) *string {
	eligibilityStatus, ok := eligibilityStringStatuses[status]
	if !ok {
		return nil
	}
	return proto.String(eligibilityStatus)
}

func stationInsuranceCard(images map[int32]*patientspb.InsuranceImage, imgType patientspb.InsuranceImageType) *string {
	imageType, ok := images[int32(imgType)]
	if !ok {
		return nil
	}
	return imageType.ImageUrl
}
