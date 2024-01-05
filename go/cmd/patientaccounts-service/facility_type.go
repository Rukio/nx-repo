package main

import (
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
)

type FacilityTypeID int64

const (
	// see sql/patientaccounts/migrations/20230914121148_add_facility_type_id.sql`.
	FacilityTypeHome                      FacilityTypeID = 1
	FacilityTypeWork                      FacilityTypeID = 2
	FacilityTypeIndependentLivingFacility FacilityTypeID = 3
	FacilityTypeAssistedLivingFacility    FacilityTypeID = 4
	FacilityTypeSkilledNursingFacility    FacilityTypeID = 5
	FacilityTypeClinic                    FacilityTypeID = 6
	FacilityTypeLongTermCareFacility      FacilityTypeID = 7
	FacilityTypeRehabilitationFacility    FacilityTypeID = 8
	FacilityTypeVirtualVisit              FacilityTypeID = 9
	FacilityTypeSeniorLivingTesting       FacilityTypeID = 10
	FacilityTypeSchool                    FacilityTypeID = 11
	FacilityTypeHotel                     FacilityTypeID = 12
)

func (v FacilityTypeID) Int64() int64 {
	return int64(v)
}

var (
	FacilityTypeProtoToID = map[patientaccountspb.FacilityType]int64{
		patientaccountspb.FacilityType_FACILITY_TYPE_HOME:                        FacilityTypeHome.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_WORK:                        FacilityTypeWork.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY: FacilityTypeIndependentLivingFacility.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_ASSISTED_LIVING_FACILITY:    FacilityTypeAssistedLivingFacility.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_SKILLED_NURSING_FACILITY:    FacilityTypeSkilledNursingFacility.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_CLINIC:                      FacilityTypeClinic.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_LONG_TERM_CARE_FACILITY:     FacilityTypeLongTermCareFacility.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_REHABILITATION_FACILITY:     FacilityTypeRehabilitationFacility.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_VIRTUAL_VISIT:               FacilityTypeVirtualVisit.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_SENIOR_LIVING_TESTING:       FacilityTypeSeniorLivingTesting.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_SCHOOL:                      FacilityTypeSchool.Int64(),
		patientaccountspb.FacilityType_FACILITY_TYPE_HOTEL:                       FacilityTypeHotel.Int64(),
	}

	FacilityTypeIDToProto = func() map[int64]patientaccountspb.FacilityType {
		res := make(map[int64]patientaccountspb.FacilityType, len(FacilityTypeProtoToID))
		for k, v := range FacilityTypeProtoToID {
			res[v] = k
		}
		return res
	}()
)
