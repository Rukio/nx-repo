package patientconv

import (
	"testing"

	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"google.golang.org/protobuf/proto"
)

var (
	clinicalProviderID = "123456"
	hasPcp             = true
)

func TestStationPCPToProto(t *testing.T) {
	tcs := []struct {
		Desc     string
		InputPCP *patient.StationPCP
		WantPCP  *patientspb.PrimaryCareProvider
		HasErr   bool
	}{
		{
			Desc: "Base case",
			InputPCP: &patient.StationPCP{
				PatientHasPCP: proto.Bool(hasPcp),
				PrimaryCareProvider: &patient.StationClinicalProvider{
					ClinicalProviderID: proto.String(clinicalProviderID),
				},
			},
			WantPCP: &patientspb.PrimaryCareProvider{
				ClinicalProviderId: proto.String(clinicalProviderID),
			},
		},
		{
			Desc:   "Nil pcp",
			HasErr: true,
		},
		{
			Desc:     "Empty pcp",
			InputPCP: &patient.StationPCP{},
			HasErr:   true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedPcp, err := StationPCPToProto(tc.InputPCP)
			if tc.HasErr {
				return
			}
			if err != nil {
				t.Errorf("StationPCP to Primary Care Provider proto hit unexpected error %s with test case %+v", err, tc)
			}
			if !proto.Equal(convertedPcp, tc.WantPCP) {
				t.Errorf("\ngot %s\nwant %s", convertedPcp, tc.WantPCP)
			}
		})
	}
}
