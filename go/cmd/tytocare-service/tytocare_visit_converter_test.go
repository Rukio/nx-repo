package main

import (
	"testing"

	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestProtoToTytoCareCreateVisit(t *testing.T) {
	visitID := "1"
	patientID := "2"
	dhmtID := "3"
	virtualAPPID := "4"
	virtualAPPRemoteAddress := "10.10.10.10"
	useTytoApp := true
	testCases := []struct {
		Desc               string
		CreateVisitRequest *tytocarepb.CreateVisitRequest
		Want               *TytoCareCreateVisitRequest
		HasErr             bool
	}{
		{
			Desc: "success - transform proto to Tyto visit",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},

			Want: &TytoCareCreateVisitRequest{
				Identifier:                   &visitID,
				AssistingClinicianIdentifier: &dhmtID,
				PatientIdentifier:            &patientID,
				ClinicalIdentifier:           &virtualAPPID,
				ClinicianRemoteAddress:       &virtualAPPRemoteAddress,
				UseTytoApp:                   &useTytoApp,
			},
			HasErr: false,
		},
		{
			Desc: "success - without VirtualAppId",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            "",
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},

			Want: &TytoCareCreateVisitRequest{
				Identifier:                   &visitID,
				AssistingClinicianIdentifier: &dhmtID,
				PatientIdentifier:            &patientID,
				ClinicalIdentifier:           new(string),
				ClinicianRemoteAddress:       &virtualAPPRemoteAddress,
				UseTytoApp:                   &useTytoApp,
			},
			HasErr: false,
		},
		{
			Desc: "success - without VirtualAppRemoteAddress",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: "",
			},

			Want: &TytoCareCreateVisitRequest{
				Identifier:                   &visitID,
				AssistingClinicianIdentifier: &dhmtID,
				PatientIdentifier:            &patientID,
				ClinicalIdentifier:           &virtualAPPID,
				ClinicianRemoteAddress:       new(string),
				UseTytoApp:                   &useTytoApp,
			},
			HasErr: false,
		},
		{
			Desc: "error - no visit info",

			HasErr: true,
		},
		{
			Desc: "error - no care request ID error",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 "",
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},

			HasErr: true,
		},
		{
			Desc: "error - no patient ID error",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               "",
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},

			HasErr: true,
		},
		{
			Desc: "error - no DHMT ID error",
			CreateVisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  "",
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCareVisit, err := ProtoToTytoCareCreateVisit(tc.CreateVisitRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("ProtoToTytoCarePatient hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCareVisit != nil {
				testutils.MustMatch(t, tytoCareVisit, tc.Want, "tytocare visit does not match")
			}
		})
	}
}

func TestTytoCareCreateVisitToProto(t *testing.T) {
	tytoCareIdentifier := "1"
	emptyString := ""
	testCases := []struct {
		Desc         string
		VisitRequest *TytoCareCreateVisitResponse
		VisitID      string
		Want         *tytocarepb.CreateVisitResponse
		HasErr       bool
	}{
		{
			Desc: "success - transform visit to proto",
			VisitRequest: &TytoCareCreateVisitResponse{
				TytoIdentifier: &tytoCareIdentifier,
			},
			VisitID: "1",

			Want: &tytocarepb.CreateVisitResponse{
				TytoCareId: tytoCareIdentifier,
				VisitId:    "1",
			},
			HasErr: false,
		},
		{
			Desc:         "error - no visit info",
			VisitRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - TytoIdentifier is nil",
			VisitRequest: &TytoCareCreateVisitResponse{
				TytoIdentifier: nil,
			},
			VisitID: "1",

			HasErr: true,
		},
		{
			Desc: "error - TytoIdentifier is empty string",
			VisitRequest: &TytoCareCreateVisitResponse{
				TytoIdentifier: &emptyString,
			},
			VisitID: "1",

			HasErr: true,
		},
		{
			Desc: "error - no visit identifier error",
			VisitRequest: &TytoCareCreateVisitResponse{
				TytoIdentifier: &tytoCareIdentifier,
			},
			VisitID: "",

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCareVisit, err := TytoCareCreateVisitToProto(tc.VisitRequest, tc.VisitID)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("TytoCareCreateVisitToProto hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCareVisit != nil {
				testutils.MustMatch(t, tytoCareVisit, tc.Want, "tyto_care visit don't match")
			}
		})
	}
}

func TestProtoToTytoCareAssignClinicianToVisit(t *testing.T) {
	visitID := "1"
	virtualAppID := "2"
	testCases := []struct {
		Desc         string
		VisitRequest *tytocarepb.AssignClinicianToVisitRequest
		Want         *TytoCareAssignClinicianToVisitRequest
		HasErr       bool
	}{
		{
			Desc: "success - transform proto to assign clinician to visit",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId:      visitID,
				VirtualAppId: virtualAppID,
			},
			Want: &TytoCareAssignClinicianToVisitRequest{
				Identifier:          &visitID,
				ClinicianIdentifier: &virtualAppID,
			},
			HasErr: false,
		},
		{
			Desc:         "error - no visit info",
			VisitRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - no virtual app id error",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId:      visitID,
				VirtualAppId: "",
			},

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCareVisit, err := ProtoToTytoCareAssignClinicianToVisit(tc.VisitRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("ProtoToTytoCareAssignClinicianToVisit hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCareVisit != nil {
				testutils.MustMatch(t, tytoCareVisit, tc.Want, "tyto_care visit don't match")
			}
		})
	}
}

func TestProtoToTytoCareActivateVisitRequest(t *testing.T) {
	visitID := "1"
	virtualAppID := "2"
	virtualAppRemoteAddress := "10.10.10.10"
	useTytoApp := true
	activeStatus := "ACTIVE"
	testCases := []struct {
		Desc         string
		VisitRequest *tytocarepb.ActivateVisitRequest
		Want         *TytoCareActivateVisitRequest
		HasErr       bool
	}{
		{
			Desc: "success - transform proto to activate visit",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAppID,
				VirtualAppRemoteAddress: virtualAppRemoteAddress,
			},

			Want: &TytoCareActivateVisitRequest{
				UseTytoApp:             &useTytoApp,
				Status:                 &activeStatus,
				Identifier:             &visitID,
				ClinicalIdentifier:     &virtualAppID,
				ClinicianRemoteAddress: &virtualAppRemoteAddress,
			},
			HasErr: false,
		},
		{
			Desc:         "error - no visit info",
			VisitRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - no virtual app id error",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            "",
				VirtualAppRemoteAddress: virtualAppRemoteAddress,
			},

			HasErr: true,
		},
		{
			Desc: "error - no virtual app remote address error",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAppID,
				VirtualAppRemoteAddress: "",
			},

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCareVisit, err := ProtoToTytoCareActivateVisit(tc.VisitRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("ProtoToTytoCareActivateVisit hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCareVisit != nil {
				testutils.MustMatch(t, tytoCareVisit, tc.Want, "tytocare visit don't match")
			}
		})
	}
}

func TestTytoCareActivateVisitToProto(t *testing.T) {
	tytoIdentifier := "1"
	clinicianURL := "test-clinician-url"
	testCases := []struct {
		Desc         string
		VisitRequest *TytoCareActivateVisitResponse
		Want         *tytocarepb.ActivateVisitResponse
		HasErr       bool
	}{
		{
			Desc: "success - activate visit to proto",
			VisitRequest: &TytoCareActivateVisitResponse{
				TytoIdentifier: &tytoIdentifier,
				ClinicianURL:   &clinicianURL,
			},

			Want: &tytocarepb.ActivateVisitResponse{
				TytoCareId:   tytoIdentifier,
				ClinicianUrl: clinicianURL,
			},
			HasErr: false,
		},
		{
			Desc:         "error - no visit info",
			VisitRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - no tyto identifier error",
			VisitRequest: &TytoCareActivateVisitResponse{
				TytoIdentifier: nil,
				ClinicianURL:   &clinicianURL,
			},

			HasErr: true,
		},
		{
			Desc: "error - no clinician url error",
			VisitRequest: &TytoCareActivateVisitResponse{
				TytoIdentifier: &tytoIdentifier,
				ClinicianURL:   nil,
			},

			HasErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			tytoCareVisit, err := TytoCareActivateVisitToProto(tc.VisitRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("TytoCareActivateVisitToProto hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if tytoCareVisit != nil {
				testutils.MustMatch(t, tytoCareVisit, tc.Want, "tytocare visit don't match")
			}
		})
	}
}

func TestProtoToTytoCareGenerateDeepLink(t *testing.T) {
	visitID := "1"
	patientID := "2"
	dhmtID := "3"
	testcases := []struct {
		Desc            string
		DeepLinkRequest *tytocarepb.GenerateDeepLinkRequest
		Want            *TytoCareGenerateDeepLinkRequest
		HasErr          bool
	}{
		{
			Desc: "success - proto to deep link",
			DeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   visitID,
				PatientId: patientID,
				DhmtId:    dhmtID,
			},

			Want: &TytoCareGenerateDeepLinkRequest{
				PatientIdentifier:            &patientID,
				AssistingClinicianIdentifier: &dhmtID,
				VisitIdentifier:              &visitID,
			},
			HasErr: false,
		},
		{
			Desc:            "error - no deep link info",
			DeepLinkRequest: nil,

			HasErr: true,
		},
		{
			Desc: "error - no patient id error",
			DeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   visitID,
				PatientId: "",
				DhmtId:    dhmtID,
			},

			HasErr: true,
		},
		{
			Desc: "error - no dhmt id error",
			DeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   visitID,
				PatientId: patientID,
				DhmtId:    "",
			},

			HasErr: true,
		},
		{
			Desc: "error - no care request id error",
			DeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   "",
				PatientId: patientID,
				DhmtId:    dhmtID,
			},

			HasErr: true,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Desc, func(t *testing.T) {
			deepLinkRes, err := ProtoToTytoCareGenerateDeepLinkReq(tc.DeepLinkRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("ProtoToTytoCareGenerateDeepLink hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if deepLinkRes != nil {
				testutils.MustMatch(t, deepLinkRes, tc.Want, "tytocare deep link don't match")
			}
		})
	}
}

func TestTytoCareGenerateDeepLinkToProto(t *testing.T) {
	var (
		androidDeepLink = "test-url"
		iosDeepLink     = "test-url"
		testcases       = []struct {
			Desc            string
			DeepLinkRequest *TytoCareGenerateDeepLinkResponse
			Want            *tytocarepb.GenerateDeepLinkResponse
			HasErr          bool
		}{
			{
				Desc: "success - map deep link to proto",
				DeepLinkRequest: &TytoCareGenerateDeepLinkResponse{
					AndroidDeepLink: &androidDeepLink,
					IOSDeepLink:     &iosDeepLink,
				},

				Want: &tytocarepb.GenerateDeepLinkResponse{
					DeepLink: iosDeepLink,
				},
				HasErr: false,
			},
			{
				Desc:            "error - no deep link info",
				DeepLinkRequest: nil,

				HasErr: true,
			},
			{
				Desc: "error - no ios deep link error",
				DeepLinkRequest: &TytoCareGenerateDeepLinkResponse{
					AndroidDeepLink: &androidDeepLink,
					IOSDeepLink:     nil,
				},

				HasErr: true,
			},
		}
	)

	for _, tc := range testcases {
		t.Run(tc.Desc, func(t *testing.T) {
			deepLinkRes, err := TytoCareGenerateDeepLinkToProtoResp(tc.DeepLinkRequest)
			if err != nil {
				if tc.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("TytoCareGenerateDeepLinkToProto hit unexpected error %s with test case %+v", err, tc)
				}
			}
			if deepLinkRes != nil {
				testutils.MustMatch(t, deepLinkRes, tc.Want, "tytocare deep link don't match")
			}
		})
	}
}
