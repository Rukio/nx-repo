package main

import (
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
)

type ConsentingRelationshipID int64

const (
	// see sql/patientaccounts/migrations/20230823154411_create_consenting_relationship_types.sql.
	ConsentingRelationshipIDSelf                  ConsentingRelationshipID = 1
	ConsentingRelationshipIDFamilyFriend          ConsentingRelationshipID = 2
	ConsentingRelationshipIDClinicianOrganization ConsentingRelationshipID = 3
	ConsentingRelationshipIDOther                 ConsentingRelationshipID = 4
)

func (v ConsentingRelationshipID) Int64() int64 {
	return int64(v)
}

var (
	ConsentingRelationshipCategoryProtoToID = map[patientaccountspb.ConsentingRelationship_Category]int64{
		patientaccountspb.ConsentingRelationship_CATEGORY_SELF:                   ConsentingRelationshipIDSelf.Int64(),
		patientaccountspb.ConsentingRelationship_CATEGORY_FAMILY_FRIEND:          ConsentingRelationshipIDFamilyFriend.Int64(),
		patientaccountspb.ConsentingRelationship_CATEGORY_CLINICIAN_ORGANIZATION: ConsentingRelationshipIDClinicianOrganization.Int64(),
		patientaccountspb.ConsentingRelationship_CATEGORY_OTHER:                  ConsentingRelationshipIDOther.Int64(),
	}

	ConsentingRelationshipIDToProto = func() map[int64]patientaccountspb.ConsentingRelationship_Category {
		res := make(map[int64]patientaccountspb.ConsentingRelationship_Category, len(ConsentingRelationshipCategoryProtoToID))
		for k, v := range ConsentingRelationshipCategoryProtoToID {
			res[v] = k
		}
		return res
	}()
)
