package patientconv

import (
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/pkg/errors"
)

var (
	errNoStationPCP = errors.New("station pcp cannot be nil")
)

func StationPCPToProto(stationPcp *patient.StationPCP) (*patientspb.PrimaryCareProvider, error) {
	if stationPcp == nil {
		return nil, errNoStationPCP
	}

	return &patientspb.PrimaryCareProvider{
		ClinicalProviderId: stationClinicalProvider(stationPcp.PrimaryCareProvider),
	}, nil
}

func stationClinicalProvider(clinicalProvider *patient.StationClinicalProvider) *string {
	if clinicalProvider == nil {
		return nil
	}
	return clinicalProvider.ClinicalProviderID
}
