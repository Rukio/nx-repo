package main

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/protoconv"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/checkfeasibility"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	nilErr = "<nil>"
)

var (
	mockSettingsService = &optimizersettings.MockSettingsService{RegionSettings: &optimizersettings.Settings{}}
)

func TestCheckFeasibility(t *testing.T) {
	marketID := proto.Int64(1)
	serviceRegionID := int64(2)
	locationID := int64(3)
	latE6 := int32(12345678)
	lngE6 := int32(98765421)
	lastOptimizerRunID := time.Now().UnixNano()
	careRequestID := time.Now().UnixNano()

	arrivalDate := &logisticspb.CheckFeasibilityVisit_ArrivalDate{ArrivalDate: &commonpb.Date{Year: 2022, Month: 7, Day: 22}}
	startTime := time.Date(2022, time.January, 1, 17, 0, 0, 0, time.Local)
	endTime := time.Date(2022, time.January, 1, 18, 0, 0, 0, time.Local)
	invalidStartTime := time.Date(2022, time.January, 1, 18, 30, 0, 0, time.Local)
	lateEndTime := time.Date(2022, time.January, 1, 20, 30, 0, 0, time.Local)
	checkFeasibilityReqWithLocation := &logisticspb.CheckFeasibilityRequest{
		Visits: []*logisticspb.CheckFeasibilityVisit{{
			MarketId:                 marketID,
			ArrivalTimeSpecification: arrivalDate,
			Location:                 &commonpb.Location{LatitudeE6: latE6, LongitudeE6: lngE6},
			IsManualAdjustment:       true,
			EntityDescriptor:         &logisticspb.CheckFeasibilityVisit_CareRequestId{CareRequestId: careRequestID},
		}}}
	checkFeasibilityReqWithoutLocation := &logisticspb.CheckFeasibilityRequest{
		Visits: []*logisticspb.CheckFeasibilityVisit{{
			MarketId:                 marketID,
			ArrivalTimeSpecification: arrivalDate,
			IsManualAdjustment:       true,
		}}}

	optimizerRun := &logisticssql.OptimizerRun{
		ID:                lastOptimizerRunID,
		SnapshotTimestamp: time.Now(),
	}
	visitLocations := []*logisticssql.Location{
		{ID: locationID, LatitudeE6: latE6, LongitudeE6: lngE6},
	}
	locIDs := []int64{locationID}

	feasibilityData := &logisticsdb.CheckFeasibilityVRPDataResult{
		IsMarketLevel: true,
		LocIDs:        locIDs,
		Diagnostics: &logisticspb.CheckFeasibilityDiagnostics{
			OptimizerRunId: lastOptimizerRunID,
		},
	}

	validServiceRegionVRPData := &logisticsdb.ServiceRegionVRPData{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        startTime,
		ShiftTeamSnapshots: []*logisticssql.ShiftTeamSnapshot{{}, {}, {}, {}},
		Settings: &optimizersettings.Settings{
			FeasibilityCheckLatenessMinutes:    120,
			FeasibilityShiftTeamStartBufferSec: 100,
			UseLimitedMarketAvailabilityChecks: true,
		},
		OpenHoursTW: &logisticsdb.TimeWindow{
			Start: time.Date(2022, time.January, 1, 8, 0, 0, 0, time.Local),
			End:   time.Date(2022, time.January, 1, 20, 0, 0, 0, time.Local),
		},
		CheckFeasibilityData: feasibilityData,
	}

	validMockDB := &MockLogisticsDB{
		GetServiceRegionCanonicalLocationsResult: visitLocations,
		GetVisitLocationsResult:                  visitLocations,
		GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
		GetLatestOptimizerRunForRegionDateResult: &logisticssql.OptimizerRun{ID: lastOptimizerRunID},
		CreateVRPProblemResult: &logisticsdb.VRPProblemData{
			OptimizerRun: optimizerRun,
		},
		AttachCheckFeasibilityRequestToProblemResult: &logisticsdb.VRPProblemData{},
		GetServiceRegionVRPDataResult:                validServiceRegionVRPData,
	}

	validMockSettingsService := &optimizersettings.MockSettingsService{
		RegionSettings: &optimizersettings.Settings{
			FeasibilityCheckLatenessMinutes:    120,
			FeasibilityShiftTeamStartBufferSec: 100,
			UseLimitedMarketAvailabilityChecks: true,
		},
	}

	problemData := &logisticsdb.VRPProblemData{
		VRPProblem: &optimizerpb.VRPProblem{
			Description: &optimizerpb.VRPDescription{
				ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(1)}},
			},
		},
		OptimizerRun: optimizerRun,
	}

	tcs := []struct {
		Desc          string
		Input         *logisticspb.CheckFeasibilityRequest
		MockDB        *MockLogisticsDB
		MockVRPSolver *MockVRPSolver
		MockSettings  *optimizersettings.MockSettingsService

		ExpectedStatusCode codes.Code
		ExpectedResponse   logisticspb.CheckFeasibilityResponse_Status
	}{
		{
			Desc:         "Base case with arrival date",
			Input:        checkFeasibilityReqWithoutLocation,
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc: "Base case with arrival window",
			Input: &logisticspb.CheckFeasibilityRequest{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					{
						MarketId: proto.Int64(1),
						ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
							ArrivalTimeWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
							}},
					}},
			},
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc:         "Base case with location",
			Input:        checkFeasibilityReqWithLocation,
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc: "Base case validate market close time",
			Input: &logisticspb.CheckFeasibilityRequest{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					{
						MarketId: proto.Int64(1),
						ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
							ArrivalTimeWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
							}},
					}},
			},
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc: "Base case validate market close time and invalid start time",
			Input: &logisticspb.CheckFeasibilityRequest{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					{
						MarketId: proto.Int64(1),
						ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
							ArrivalTimeWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&invalidStartTime),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&lateEndTime),
							}},
					}},
			},
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_MARKET_INFEASIBLE_CLOSING_SOON,
		},
		{
			Desc:  "Nearing capacity infeasible visit",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetVisitLocationsResult:                      visitLocations,
				GetServiceRegionForStationMarketIDResult:     &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemResult:                       problemData,
				AttachCheckFeasibilityRequestToProblemResult: problemData,
				GetServiceRegionVRPDataResult:                validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,
			MockVRPSolver: &MockVRPSolver{
				hardScores:   []int64{0, 100, 0, 0, 0}, // visit infeasible but market under capacity
				isValidScore: true,
			},

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_NEARING_CAPACITY,
		},
		{
			Desc:  "Nearing capacity feasible visit",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetVisitLocationsResult:                  visitLocations,
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemResult: &logisticsdb.VRPProblemData{
					VRPProblem: &optimizerpb.VRPProblem{
						Description: &optimizerpb.VRPDescription{
							ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(1)}},
						},
					},
					OptimizerRun: optimizerRun,
				},
				AttachCheckFeasibilityRequestToProblemResult: &logisticsdb.VRPProblemData{
					OptimizerRun: optimizerRun,
				},
				GetServiceRegionVRPDataResult: validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,
			MockVRPSolver: &MockVRPSolver{
				hardScores:   []int64{100, 0, 0, 0, 0}, // market over capacity but visit feasible
				isValidScore: true,
			},

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_NEARING_CAPACITY,
		},
		{
			Desc:  "Nearing capacity infeasible visit with market at capacity",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetVisitLocationsResult:                  visitLocations,
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemResult: &logisticsdb.VRPProblemData{
					VRPProblem: &optimizerpb.VRPProblem{
						Description: &optimizerpb.VRPDescription{
							ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(1)}},
						},
					},
					OptimizerRun: optimizerRun,
				},
				AttachCheckFeasibilityRequestToProblemResult: &logisticsdb.VRPProblemData{
					OptimizerRun: optimizerRun,
				},
				GetServiceRegionVRPDataResult: validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,
			MockVRPSolver: &MockVRPSolver{
				hardScores:   []int64{100, 100, 0, 0, 0}, // visit infeasible and market over capacity
				isValidScore: true,
			},

			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc: "Without location, no service region found will error with NotFound",
			Input: &logisticspb.CheckFeasibilityRequest{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					{
						MarketId:                 proto.Int64(1),
						ArrivalTimeSpecification: arrivalDate,
					}},
			},
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDErr: errors.New("no service region for market lol"),
				GetServiceRegionVRPDataResult:         validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:  "With location, no service region found will error with NotFound",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDErr: errors.New("no service region for market lol"),
				GetServiceRegionVRPDataResult:         validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:  "Error for CreateVRPProblem will error with InternalError",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemErr:                      errors.New("createVRPProblem error lol"),
				GetServiceRegionVRPDataResult:            validServiceRegionVRPData,
			},
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:  "No check feasibility data return infeasible ",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				GetLatestOptimizerRunForRegionDateResult: &logisticssql.OptimizerRun{ID: lastOptimizerRunID},
				GetServiceRegionVRPDataResult:            &logisticsdb.ServiceRegionVRPData{},
			},
			ExpectedStatusCode: codes.OK,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Desc:  "Error for OptimizerService Recv stream will error with InternalError",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetVisitLocationsResult:                      visitLocations,
				GetServiceRegionForStationMarketIDResult:     &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemResult:                       problemData,
				GetLatestOptimizerRunForRegionDateResult:     &logisticssql.OptimizerRun{ID: lastOptimizerRunID},
				AttachCheckFeasibilityRequestToProblemResult: problemData,
				GetServiceRegionVRPDataResult:                validServiceRegionVRPData,
			},
			MockVRPSolver: &MockVRPSolver{err: errors.New("lol optimizer recv failed")},
			MockSettings:  validMockSettingsService,

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:  "Error for OptimizerService SolveVRP will error with InternalError",
			Input: checkFeasibilityReqWithLocation,
			MockDB: &MockLogisticsDB{
				GetVisitLocationsResult:                      visitLocations,
				GetServiceRegionForStationMarketIDResult:     &logisticssql.ServiceRegion{ID: serviceRegionID, IanaTimeZoneName: "America/Denver"},
				CreateVRPProblemResult:                       problemData,
				GetLatestOptimizerRunForRegionDateResult:     &logisticssql.OptimizerRun{ID: lastOptimizerRunID},
				AttachCheckFeasibilityRequestToProblemResult: problemData,
				GetServiceRegionVRPDataResult:                validServiceRegionVRPData,
			},
			MockVRPSolver: &MockVRPSolver{err: errors.New("lol optimizer solveVRP failed")},
			MockSettings:  validMockSettingsService,

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc: "More than one visit will error with InvalidArgument",
			Input: &logisticspb.CheckFeasibilityRequest{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					{
						MarketId:                 marketID,
						ArrivalTimeSpecification: arrivalDate,
					},
					{
						MarketId: marketID,
						ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
							ArrivalTimeWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
							}},
					},
				}},
			MockDB:       validMockDB,
			MockSettings: validMockSettingsService,

			ExpectedStatusCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			if tc.MockDB.GetServiceRegionVRPDataResult != nil &&
				tc.MockDB.GetServiceRegionVRPDataResult.CheckFeasibilityData != nil {
				tc.MockDB.GetServiceRegionVRPDataResult.CheckFeasibilityData.Visits = tc.Input.Visits
				tc.MockDB.GetServiceRegionVRPDataResult.Settings = tc.MockSettings.RegionSettings
			}

			mockMapService := &MockMapService{GetRouteErr: errors.New("who needs a map?")}
			s := GRPCServer{
				LogisticsDB:      tc.MockDB,
				VRPSolver:        tc.MockVRPSolver,
				SettingsService:  tc.MockSettings,
				MapServicePicker: logistics.NewMapServicePicker(mockMapService, mockMapService, validMockSettingsService),
			}
			_, err := s.CheckFeasibility(context.Background(), proto.Clone(tc.Input).(*logisticspb.CheckFeasibilityRequest))
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", err, tc.ExpectedStatusCode)
			}
		})
	}
}

func TestRequestShiftTeamRestBreak(t *testing.T) {
	shiftTeamID := time.Now().Unix()
	serviceRegionID := int64(1)
	tcs := []struct {
		Desc   string
		Input  *logisticspb.RequestShiftTeamRestBreakRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc: "Base case",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{
				AddShiftTeamRestBreakRequestResult: &logisticsdb.AddShiftTeamRestBreakResponse{
					ServiceRegionID: serviceRegionID,
				},
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "no shift team ID is invalid argument",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: 0,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc: "no duration sec is invalid argument",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: nil},
					},
				},
			},
			MockDB: &MockLogisticsDB{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc: "unknown shift team is failed precondition",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamLocationIDErr: logisticsdb.ErrUnknownShiftTeam},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc: "unknown shift team location is failed precondition",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamLocationIDErr: logisticsdb.ErrNoShiftTeamLocation},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc: "other DB get error is Internal error",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamLocationIDErr: errors.New("random unknown error")},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc: "no break type is invalid argument",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType:   nil,
				},
			},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamLocationIDErr: errors.New("random unknown error")},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc: "failed to add is internal",
			Input: &logisticspb.RequestShiftTeamRestBreakRequest{
				RestBreak: &logisticspb.ShiftTeamRestBreakRequest{
					ShiftTeamId: shiftTeamID,
					BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
						OnDemand: &logisticspb.BreakOnDemand{DurationSec: proto.Int64(30)},
					},
				},
			},
			MockDB: &MockLogisticsDB{AddShiftTeamRestBreakRequestErr: errors.New("random unknown error")},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			_, err := s.RequestShiftTeamRestBreak(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Fatalf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
		})
	}
}

func TestRequestShiftTeamRestBreak_ExhaustiveSwitch(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&logisticspb.ShiftTeamRestBreakRequest{},
		"break_type", []string{"on_demand"},
		"the new break_type must be handled in the ShiftTeamRestBreak switch statement",
	)
}

func TestRemoveCareRequest(t *testing.T) {
	careRequestID := int64(1)
	deletedResult := logisticsdb.DeleteVisitSnapshotForCareRequestIDResponse{
		ServiceRegionID: int64(1),
	}
	tcs := []struct {
		Desc   string
		Input  *logisticspb.RemoveCareRequestRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:   "Base case",
			Input:  &logisticspb.RemoveCareRequestRequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{DeleteVisitSnapshotForCareRequestIDResult: &deletedResult},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:   "Care request not supplied error",
			Input:  &logisticspb.RemoveCareRequestRequest{},
			MockDB: &MockLogisticsDB{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:   "Care request ID not found error",
			Input:  &logisticspb.RemoveCareRequestRequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{DeleteVisitSnapshotForCareRequestIDErr: logisticsdb.ErrUnknownCareRequest},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:  "Error deleting care request, unknown care request",
			Input: &logisticspb.RemoveCareRequestRequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				DeleteVisitSnapshotForCareRequestIDErr:    logisticsdb.ErrUnknownCareRequest,
				DeleteVisitSnapshotForCareRequestIDResult: &deletedResult,
			},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:  "Error deleting care request, other error",
			Input: &logisticspb.RemoveCareRequestRequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				DeleteVisitSnapshotForCareRequestIDErr:    errors.New("visit snapshot not found"),
				DeleteVisitSnapshotForCareRequestIDResult: &deletedResult,
			},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			_, err := s.RemoveCareRequest(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
		})
	}
}

func TestUpsertCareRequest(t *testing.T) {
	careRequestID := int64(1)
	marketID := int64(1)
	careRequestStatusName := "status_name"
	getVisitResponseSuccessMock := episodepb.GetVisitResponse{
		CareRequest: &commonpb.CareRequestInfo{
			Id: careRequestID, MarketId: &marketID, RequestStatus: &commonpb.CareRequestStatus{
				Name:       &careRequestStatusName,
				SourceType: commonpb.CareRequestStatus_SOURCE_TYPE_UNSPECIFIED.Enum(),
			}}}

	tcs := []struct {
		Desc                     string
		Input                    *logisticspb.UpsertCareRequestRequest
		MockDB                   *MockLogisticsDB
		MockEpisodeServiceClient *MockEpisodeServiceClient

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:                     "Base case",
			Input:                    &logisticspb.UpsertCareRequestRequest{CareRequestId: careRequestID},
			MockDB:                   &MockLogisticsDB{},
			MockEpisodeServiceClient: &MockEpisodeServiceClient{GetVisitResult: &getVisitResponseSuccessMock},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:  "CareRequestID not supplied error",
			Input: &logisticspb.UpsertCareRequestRequest{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:  "CareRequestID invalid error",
			Input: &logisticspb.UpsertCareRequestRequest{CareRequestId: *proto.Int64(-1)},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:                     "Error getting Care Request",
			Input:                    &logisticspb.UpsertCareRequestRequest{CareRequestId: careRequestID},
			MockDB:                   &MockLogisticsDB{},
			MockEpisodeServiceClient: &MockEpisodeServiceClient{GetVisitErr: errors.New("who knows lol")},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:                     "Unavailable error getting Care Request",
			Input:                    &logisticspb.UpsertCareRequestRequest{CareRequestId: careRequestID},
			MockDB:                   &MockLogisticsDB{},
			MockEpisodeServiceClient: &MockEpisodeServiceClient{GetVisitErr: status.Error(codes.Unavailable, "come back later")},

			ExpectedStatusCode: codes.Unavailable,
		},
		{
			Desc:                     "Error writing Care Request snapshot",
			Input:                    &logisticspb.UpsertCareRequestRequest{CareRequestId: careRequestID},
			MockDB:                   &MockLogisticsDB{WriteVisitSnapshotErr: errors.New("some network issue idk")},
			MockEpisodeServiceClient: &MockEpisodeServiceClient{GetVisitResult: &getVisitResponseSuccessMock},

			ExpectedStatusCode: codes.Unknown,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB, EpisodeService: tc.MockEpisodeServiceClient}
			_, err := s.UpsertCareRequest(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
		})
	}
}

func TestUpsertVisitIfFeasible(t *testing.T) {
	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	marketID := baseID + 2
	userID := baseID + 3
	channelItemID := baseID + 4
	completionValueCents := baseID + 5
	partnerPriorityScore := baseID + 6
	serviceRegionID := baseID + 7
	locationID := baseID + 8
	lastOptimizerRunID := baseID + 9
	shiftTeamID := baseID + 10
	latitudeE6 := int32(baseID + 11)
	longitudeE6 := int32(baseID + 12)
	sourceType := commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER
	statusSourceType := commonpb.StatusSourceType_STATUS_SOURCE_TYPE_PROVIDER
	patientAge := int32(10)
	location := &commonpb.Location{LatitudeE6: latitudeE6, LongitudeE6: longitudeE6}
	startTime := time.Date(2022, time.January, 1, 12, 0, 0, 0, time.UTC)
	endTime := startTime.Add(time.Hour * 1)
	arrivalTimeWindow := commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
	}

	serviceDuration := int64(3600)
	careRequestStatusName := requestedStatusName
	invalidCareRequestStatusName := "invalid"

	upsertIfFeasibleRequest := &logisticspb.UpsertVisitIfFeasibleRequest{
		CareRequestInfo: &commonpb.CareRequestInfo{
			Id:                 careRequestID,
			MarketId:           &marketID,
			ServiceDurationSec: &serviceDuration,
			Location:           location,
			ArrivalTimeWindow:  &arrivalTimeWindow,
			RequestStatus: &commonpb.CareRequestStatus{
				UserId:           &userID,
				Name:             &careRequestStatusName,
				SourceType:       &sourceType,
				StatusSourceType: &statusSourceType,
			},
			Acuity: &commonpb.AcuityInfo{
				PatientAge: &patientAge,
			},
			Priority: &commonpb.CareRequestPriority{
				RequestedByUserId: &userID,
			},
			Partner: &commonpb.Partner{
				ChannelItemId: &channelItemID,
			},
			Value: &commonpb.CareRequestValue{
				CompletionValueCents: &completionValueCents,
				PartnerPriorityScore: &partnerPriorityScore,
			},
		},
	}

	optimizerRun := &logisticssql.OptimizerRun{
		ID: lastOptimizerRunID,
	}
	visitLocations := []*logisticssql.Location{
		{ID: locationID, LatitudeE6: latitudeE6, LongitudeE6: longitudeE6},
	}

	feasibilityData := &logisticsdb.CheckFeasibilityVRPDataResult{
		IsMarketLevel: true,
		LocIDs:        []int64{locationID},
		Visits: []*logisticspb.CheckFeasibilityVisit{{
			MarketId:           &marketID,
			ServiceDurationSec: &serviceDuration,
			Location:           location,
			ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
				ArrivalTimeWindow: &arrivalTimeWindow,
			},
		}},
		Diagnostics: &logisticspb.CheckFeasibilityDiagnostics{
			OptimizerRunId: lastOptimizerRunID,
		},
	}

	validServiceRegionVRPData := &logisticsdb.ServiceRegionVRPData{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        startTime,
		ShiftTeamSnapshots: []*logisticssql.ShiftTeamSnapshot{{}, {}, {}, {}},
		Settings: &optimizersettings.Settings{
			FeasibilityCheckLatenessMinutes:    120,
			FeasibilityShiftTeamStartBufferSec: 100,
		},
		OpenHoursTW: &logisticsdb.TimeWindow{
			Start: time.Date(2022, time.January, 1, 8, 0, 0, 0, time.UTC),
			End:   time.Date(2022, time.January, 1, 20, 0, 0, 0, time.UTC),
		},
		CheckFeasibilityData: feasibilityData,
	}

	problemData := &logisticsdb.VRPProblemData{
		VRPProblem: &optimizerpb.VRPProblem{
			Description: &optimizerpb.VRPDescription{
				ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(shiftTeamID)}},
			},
		},
		OptimizerRun: optimizerRun,
	}

	validMockDB := &MockLogisticsDB{
		GetServiceRegionCanonicalLocationsResult: visitLocations,
		GetVisitLocationsResult:                  visitLocations,
		GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{
			ID:               serviceRegionID,
			IanaTimeZoneName: "America/Denver",
		},
		GetLatestOptimizerRunForRegionDateResult: &logisticssql.OptimizerRun{
			ID: lastOptimizerRunID,
		},
		CreateVRPProblemResult: &logisticsdb.VRPProblemData{
			OptimizerRun: optimizerRun,
		},
		AttachCheckFeasibilityRequestToProblemResult: problemData,
		GetServiceRegionVRPDataResult:                validServiceRegionVRPData,
	}

	invalidWriteMockDB := *validMockDB
	invalidWriteMockDB.WriteVisitSnapshotErr = errors.New("some network issue idk")

	mockSettingsService := &optimizersettings.MockSettingsService{
		RegionSettings: &optimizersettings.Settings{
			FeasibilityCheckLatenessMinutes:    120,
			FeasibilityShiftTeamStartBufferSec: 100,
			UseLimitedMarketAvailabilityChecks: false,
		},
	}

	tcs := []struct {
		Desc                  string
		Input                 *logisticspb.UpsertVisitIfFeasibleRequest
		MockDB                *MockLogisticsDB
		HardScore             int64
		LockErr               error
		CareRequestStatusName *string

		ExpectedResponse   logisticspb.UpsertVisitIfFeasibleResponse_FeasibilityStatus
		ExpectedStatusCode codes.Code
	}{
		{
			Desc:                  "Feasible visit",
			Input:                 upsertIfFeasibleRequest,
			MockDB:                validMockDB,
			CareRequestStatusName: &careRequestStatusName,

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_FEASIBLE,
			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:                  "Infeasible visit",
			Input:                 upsertIfFeasibleRequest,
			MockDB:                validMockDB,
			HardScore:             100,
			CareRequestStatusName: &careRequestStatusName,

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_INFEASIBLE,
			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:                  "Error upserting Care Request",
			Input:                 upsertIfFeasibleRequest,
			MockDB:                &invalidWriteMockDB,
			CareRequestStatusName: &careRequestStatusName,

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_FEASIBLE,
			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:                  "Input data not supplied error",
			Input:                 &logisticspb.UpsertVisitIfFeasibleRequest{},
			MockDB:                validMockDB,
			CareRequestStatusName: &careRequestStatusName,

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_UNSPECIFIED,
			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:                  "Invalid status name in upsert if feasible request",
			Input:                 upsertIfFeasibleRequest,
			MockDB:                validMockDB,
			CareRequestStatusName: &invalidCareRequestStatusName,

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_UNSPECIFIED,
			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:                  "Error acquiring lock",
			Input:                 upsertIfFeasibleRequest,
			MockDB:                validMockDB,
			CareRequestStatusName: &careRequestStatusName,
			LockErr:               errors.New("idk some network error"),

			ExpectedResponse:   logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_UNSPECIFIED,
			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB,
				VRPSolver: &MockVRPSolver{
					hardScores:   []int64{tc.HardScore},
					isValidScore: true,
				},
				SettingsService: mockSettingsService,
				LockDB: &MockLockDB{
					LockResult: nil,
					LockErr:    tc.LockErr,
				},
			}
			if tc.Input.GetCareRequestInfo() != nil {
				tc.Input.CareRequestInfo.RequestStatus.Name = tc.CareRequestStatusName
			}
			response, err := s.UpsertVisitIfFeasible(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
			if response != nil {
				testutils.MustMatch(t, tc.ExpectedResponse, response.FeasibilityStatus)
			}
		})
	}
}

func TestGetShiftTeamSchedule(t *testing.T) {
	validSchedule := &logisticsdb.ShiftTeamSchedule{
		Schedule: &logisticspb.ShiftTeamSchedule{ShiftTeamId: 123456},
		Metadata: &logisticspb.ScheduleMetadata{
			ServiceDate: &commonpb.Date{
				Year:  2022,
				Month: 8,
				Day:   1,
			},
			GeneratedAt: timestamppb.New(time.Now()),
		},
	}
	tcs := []struct {
		Desc   string
		Input  *logisticspb.GetShiftTeamScheduleRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
		Output             *logisticspb.GetShiftTeamScheduleResponse
	}{
		{
			Desc:   "Base case",
			Input:  &logisticspb.GetShiftTeamScheduleRequest{},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamScheduleResult: validSchedule},

			ExpectedStatusCode: codes.OK,
			Output:             &logisticspb.GetShiftTeamScheduleResponse{Schedule: validSchedule.Schedule, Meta: validSchedule.Metadata},
		},
		{
			Desc:   "ShiftTeam NotFound error",
			Input:  &logisticspb.GetShiftTeamScheduleRequest{},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamScheduleErr: logisticsdb.ErrUnknownShiftTeam},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:   "Arbitrary ShiftTeam error",
			Input:  &logisticspb.GetShiftTeamScheduleRequest{},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamScheduleErr: errors.New("my errors are arbitrary nyehehe")},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			resp, err := s.GetShiftTeamSchedule(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
			testutils.MustMatch(t, tc.Output, resp, "output does not match expected output")
		})
	}
}

func TestUpsertShiftTeam(t *testing.T) {
	shiftTeamID := int64(1)
	marketID := int64(2)
	tcs := []struct {
		Desc                 string
		Input                *logisticspb.UpsertShiftTeamRequest
		MockDB               *MockLogisticsDB
		MockShiftTeamService *MockShiftTeamServiceClient

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:                 "Base case",
			Input:                &logisticspb.UpsertShiftTeamRequest{ShiftTeamId: shiftTeamID},
			MockDB:               &MockLogisticsDB{},
			MockShiftTeamService: &MockShiftTeamServiceClient{GetShiftTeamResult: &shiftteampb.GetShiftTeamResponse{ShiftTeam: &shiftteampb.ShiftTeam{Id: shiftTeamID, MarketId: &marketID}}},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:  "Shift Team not supplied error",
			Input: &logisticspb.UpsertShiftTeamRequest{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:                 "Error getting Shift Team",
			Input:                &logisticspb.UpsertShiftTeamRequest{ShiftTeamId: shiftTeamID},
			MockDB:               &MockLogisticsDB{},
			MockShiftTeamService: &MockShiftTeamServiceClient{GetShiftTeamErr: errors.New("who knows lol")},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:                 "Error getting Shift Team",
			Input:                &logisticspb.UpsertShiftTeamRequest{ShiftTeamId: shiftTeamID},
			MockDB:               &MockLogisticsDB{},
			MockShiftTeamService: &MockShiftTeamServiceClient{GetShiftTeamErr: status.Error(codes.Unavailable, "come back later")},

			ExpectedStatusCode: codes.Unavailable,
		},
		{
			Desc:                 "Error writing Shift Team snapshot",
			Input:                &logisticspb.UpsertShiftTeamRequest{ShiftTeamId: shiftTeamID},
			MockDB:               &MockLogisticsDB{WriteShiftTeamSnapshotErr: errors.New("some network issue idk")},
			MockShiftTeamService: &MockShiftTeamServiceClient{GetShiftTeamResult: &shiftteampb.GetShiftTeamResponse{ShiftTeam: &shiftteampb.ShiftTeam{Id: shiftTeamID, MarketId: &marketID}}},

			ExpectedStatusCode: codes.Unknown,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB, ShiftTeamService: tc.MockShiftTeamService}
			_, err := s.UpsertShiftTeam(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
		})
	}
}

func TestUpsertMarket(t *testing.T) {
	marketID := int64(1)
	market := &marketpb.Market{
		Id:               marketID,
		Name:             proto.String("Tatooine"),
		IanaTimeZoneName: proto.String("America/Denver"),
		ShortName:        proto.String("TAT"),
		Enabled:          proto.Bool(true),
	}
	tcs := []struct {
		Desc                    string
		Input                   *logisticspb.UpsertMarketRequest
		MockDB                  *MockLogisticsDB
		MockMarketServiceClient *MockMarketServiceClient

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:   "Base case",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{Market: market},
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:   "MarketID not included error",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: nil},
			MockDB: &MockLogisticsDB{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:   "GetMarket error",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketErr: errors.New("star wars isnt real"),
			},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:   "GetMarket error",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketErr: status.Error(codes.Unavailable, "come back later"),
			},

			ExpectedStatusCode: codes.Unavailable,
		},
		{
			Desc:   "No market name in GetMarket response",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               marketID,
						IanaTimeZoneName: proto.String("America/Denver"),
						Name:             nil,
						ShortName:        proto.String("TAT"),
						Enabled:          proto.Bool(true),
					}}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:   "No time zone in GetMarket response",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:        marketID,
						Name:      proto.String("Tatooine"),
						ShortName: proto.String("TAT"),
						Enabled:   proto.Bool(true),
					}}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:   "No short name in GetMarket response",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               marketID,
						Name:             proto.String("Tatooine"),
						IanaTimeZoneName: proto.String("America/Denver"),
						ShortName:        nil,
						Enabled:          proto.Bool(true),
					}}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:   "No enabled in GetMarket response",
			Input:  &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               marketID,
						Name:             proto.String("Tatooine"),
						IanaTimeZoneName: proto.String("America/Denver"),
						ShortName:        proto.String("TAT"),
						Enabled:          nil,
					}}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:  "LogisticsDB error",
			Input: &logisticspb.UpsertMarketRequest{MarketId: &marketID},
			MockDB: &MockLogisticsDB{
				UpsertMarketAndServiceRegionFromStationMarketErr: errors.New("haha no dice"),
			},
			MockMarketServiceClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{Market: market},
			},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB, MarketService: tc.MockMarketServiceClient}
			_, err := s.UpsertMarket(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
		})
	}
}

func TestUpdateShiftTeamLoc(t *testing.T) {
	shiftTeamID := int64(1)
	serviceRegionID := int64(2)
	location := &commonpb.Location{LatitudeE6: 123456, LongitudeE6: 654321}
	tcs := []struct {
		Desc   string
		Input  *logisticspb.UpdateShiftTeamLocRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:  "Base case",
			Input: &logisticspb.UpdateShiftTeamLocRequest{ShiftTeamId: shiftTeamID, Location: location},
			MockDB: &MockLogisticsDB{
				UpdateShiftTeamLocationResult: &logisticsdb.UpdateShiftTeamLocationResponse{ServiceRegionID: &serviceRegionID},
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:  "Not Found error",
			Input: &logisticspb.UpdateShiftTeamLocRequest{ShiftTeamId: shiftTeamID, Location: location},
			MockDB: &MockLogisticsDB{
				UpdateShiftTeamLocationErr: logisticsdb.ErrUnknownShiftTeam,
			},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:  "Internal error",
			Input: &logisticspb.UpdateShiftTeamLocRequest{ShiftTeamId: shiftTeamID, Location: location},
			MockDB: &MockLogisticsDB{
				UpdateShiftTeamLocationErr: errors.New("some other error"),
			},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			_, err := s.UpdateShiftTeamLoc(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
		})
	}
}

func TestGetCareRequestETA(t *testing.T) {
	careRequestID := proto.Int64(1)
	duration := 1 * time.Hour
	now := time.Now()
	etaSec := proto.Int64(now.Add(duration).Unix())
	noMapService := &MockMapService{GetDistanceSourceIDResult: 0}

	tcs := []struct {
		Desc           string
		Input          *logisticspb.GetCareRequestETARequest
		MockDB         *MockLogisticsDB
		MockMapService *MockMapService

		ExpectedStatusCode codes.Code
		ExpectedResponse   *logisticspb.GetCareRequestETAResponse
	}{
		{
			Desc:  "CareRequest en route will return realtime precision",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameEnRoute.String(),
					VisitLocation:       &logisticssql.Location{LatitudeE6: 1, LongitudeE6: 2},
					ShiftTeamLocation:   &logisticssql.Location{LatitudeE6: 3, LongitudeE6: 4},
				}},
			MockMapService: &MockMapService{GetRouteResult: &logistics.Route{Distance: logistics.Distance{Duration: duration}}},

			ExpectedStatusCode: codes.OK,
			ExpectedResponse: &logisticspb.GetCareRequestETAResponse{
				EstimatedArrivalTimestampSec: etaSec,
				Precision:                    logisticspb.GetCareRequestETAResponse_PRECISION_EN_ROUTE_REALTIME.Enum(),
			},
		},
		{
			Desc:  "CareRequest uncommitted will return coarse precision",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameUncommitted.String(),
					CareRequestEtaSec:   int64(12345),
				}},
			MockMapService: &MockMapService{GetRouteResult: &logistics.Route{Distance: logistics.Distance{Duration: duration}}},
			ExpectedResponse: &logisticspb.GetCareRequestETAResponse{
				EstimatedArrivalTimestampSec: proto.Int64(12345),
				Precision:                    logisticspb.GetCareRequestETAResponse_PRECISION_COARSE.Enum(),
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:  "CareRequest committed will return coarse precision",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameCommitted.String(),
					CareRequestEtaSec:   int64(12345),
				}},
			MockMapService: &MockMapService{GetRouteResult: &logistics.Route{Distance: logistics.Distance{Duration: duration}}},
			ExpectedResponse: &logisticspb.GetCareRequestETAResponse{
				EstimatedArrivalTimestampSec: proto.Int64(12345),
				Precision:                    logisticspb.GetCareRequestETAResponse_PRECISION_COARSE.Enum(),
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc:  "CareRequest ID missing",
			Input: &logisticspb.GetCareRequestETARequest{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:   "GetLatestInfoForCareRequest no care request error",
			Input:  &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{GetLatestInfoForCareRequestErr: logisticsdb.ErrUnknownCareRequest},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:   "GetLatestInfoForCareRequest random error",
			Input:  &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{GetLatestInfoForCareRequestErr: errors.New("cannot find care request")},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:  "CareRequest already completed will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameCompleted.String(),
				}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:  "CareRequest already canceled will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameCancelled.String(),
				}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:  "CareRequest already on scene will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameOnScene.String(),
				}},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
		{
			Desc:  "CareRequest en route missing visit location will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameEnRoute.String(),
					ShiftTeamLocation:   &logisticssql.Location{LatitudeE6: 3, LongitudeE6: 4},
				}},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:  "CareRequest with unknown visit phase type will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: "iamunknown",
				}},

			ExpectedStatusCode: codes.Unknown,
		},
		{
			Desc:  "CareRequest en route missing shift team location will error",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameEnRoute.String(),
					VisitLocation:       &logisticssql.Location{LatitudeE6: 1, LongitudeE6: 2},
				}},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:  "MapService error will return codes.FailedPrecondition",
			Input: &logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID},
			MockDB: &MockLogisticsDB{
				GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
					VisitPhaseShortName: logisticsdb.VisitPhaseTypeShortNameEnRoute.String(),
					VisitLocation:       &logisticssql.Location{LatitudeE6: 1, LongitudeE6: 2},
					ShiftTeamLocation:   &logisticssql.Location{LatitudeE6: 3, LongitudeE6: 4},
				}},
			MockMapService: &MockMapService{GetRouteErr: errors.New("who needs a map?")},

			ExpectedStatusCode: codes.FailedPrecondition,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			mapService := tc.MockMapService
			if mapService == nil {
				mapService = noMapService
			}

			s := GRPCServer{
				LogisticsDB:      tc.MockDB,
				MapServicePicker: logistics.NewMapServicePicker(mapService, mapService, mockSettingsService),
				Clock:            MockClock(now),
			}
			resp, err := s.GetCareRequestETA(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.ExpectedResponse, resp, "unexpected response")
		})
	}
}

func TestGetOptimizerRunDiagnostics(t *testing.T) {
	validOptimizerRunID := int64(1)
	resp := &logisticsdb.OptimizerRunDiagnostics{
		Run: &logisticssql.OptimizerRun{
			ID:             validOptimizerRunID,
			ServiceVersion: "<some logistics version>",
		},
		RunError:         &logisticssql.OptimizerRunError{ErrorValue: "optimizer-run-error"},
		OptimizerVersion: "<some optimizer version>",
		Problem:          &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{}},
	}
	unknownRunErrResp := &logisticsdb.OptimizerRunDiagnostics{
		Run: &logisticssql.OptimizerRun{
			ID:             validOptimizerRunID,
			ServiceVersion: "<some logistics version>",
		},
		RunError:         &logisticssql.OptimizerRunError{ErrorValue: "foo", OptimizerRunErrorSourceID: int64(-123)},
		OptimizerVersion: "<some optimizer version>",
		Problem:          &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{}},
	}
	tcs := []struct {
		Desc   string
		Input  *logisticspb.GetOptimizerRunDiagnosticsRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc:               "Invalid 0 run ID",
			Input:              &logisticspb.GetOptimizerRunDiagnosticsRequest{OptimizerRunId: 0},
			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:               "ErrUnknownOptimizerRunID",
			Input:              &logisticspb.GetOptimizerRunDiagnosticsRequest{OptimizerRunId: validOptimizerRunID},
			MockDB:             &MockLogisticsDB{GetOptimizerRunDiagnosticsErr: logisticsdb.ErrUnknownOptimizerRunID},
			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:               "other GetOptimizerRunDiagnosticsErr",
			Input:              &logisticspb.GetOptimizerRunDiagnosticsRequest{OptimizerRunId: validOptimizerRunID},
			MockDB:             &MockLogisticsDB{GetOptimizerRunDiagnosticsErr: errors.New("some other error")},
			ExpectedStatusCode: codes.Unknown,
		},
		{
			Desc:               "base case",
			Input:              &logisticspb.GetOptimizerRunDiagnosticsRequest{OptimizerRunId: validOptimizerRunID},
			MockDB:             &MockLogisticsDB{GetOptimizerRunDiagnosticsResult: unknownRunErrResp},
			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc:               "base case",
			Input:              &logisticspb.GetOptimizerRunDiagnosticsRequest{OptimizerRunId: validOptimizerRunID},
			MockDB:             &MockLogisticsDB{GetOptimizerRunDiagnosticsResult: resp},
			ExpectedStatusCode: codes.OK,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			_, err := s.GetOptimizerRunDiagnostics(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
		})
	}
}

func TestGetCareRequestETA_VisitPhaseTypeShortNamesAreImplemented(t *testing.T) {
	careRequestID := proto.Int64(1)
	now := time.Now()

	type TestCase struct {
		Desc   string
		MockDB *MockLogisticsDB
	}

	tcs := []TestCase{}

	for visitPhaseStr, visitPhaseInt := range logisticspb.VisitPhase_value {
		if logisticspb.VisitPhase(visitPhaseInt) != logisticspb.VisitPhase_VISIT_PHASE_UNSPECIFIED {
			tcs = append(tcs, TestCase{
				Desc: fmt.Sprintf("Visit phase: %s", visitPhaseStr),
				MockDB: &MockLogisticsDB{
					GetLatestInfoForCareRequestResult: &logisticsdb.CareRequestLatestInfo{
						VisitPhaseShortName: logisticsdb.VisitPhaseToShortNames[logisticspb.VisitPhase(visitPhaseInt)].String(),
						VisitLocation:       &logisticssql.Location{LatitudeE6: 1, LongitudeE6: 2},
					}},
			})
		}
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB, Clock: MockClock(now)}
			input := logisticspb.GetCareRequestETARequest{CareRequestId: careRequestID}
			_, err := s.GetCareRequestETA(context.Background(), &input)
			if status.Code(err) == codes.Unimplemented {
				t.Errorf("Visit phase type was unimplemented for test case %s", tc.Desc)
			}
		})
	}
}

func TestGetServiceRegionSchedule(t *testing.T) {
	marketID := proto.Int64(1)
	validSchedules := []*logisticspb.ServiceRegionDateSchedule{}
	validSchedulesResponse := logisticsdb.LatestShiftTeamSchedulesResponse{ShiftTeamSchedules: validSchedules}
	tcs := []struct {
		Desc   string
		Input  *logisticspb.GetServiceRegionScheduleRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
		Output             *logisticspb.GetServiceRegionScheduleResponse
	}{
		{
			Desc:   "Base case",
			Input:  &logisticspb.GetServiceRegionScheduleRequest{MarketId: marketID},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamSchedulesInServiceRegionResult: &validSchedulesResponse},

			ExpectedStatusCode: codes.OK,
			Output:             &logisticspb.GetServiceRegionScheduleResponse{DateSchedules: validSchedules},
		},
		{
			Desc:   "No market ID error",
			Input:  &logisticspb.GetServiceRegionScheduleRequest{},
			MockDB: &MockLogisticsDB{},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc:   "ServiceRegion not found for market ID error",
			Input:  &logisticspb.GetServiceRegionScheduleRequest{MarketId: marketID},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamSchedulesInServiceRegionErr: logisticsdb.ErrServiceRegionMarketNotFound},

			ExpectedStatusCode: codes.NotFound,
		},
		{
			Desc:   "Arbitrary ShiftTeam error",
			Input:  &logisticspb.GetServiceRegionScheduleRequest{MarketId: marketID},
			MockDB: &MockLogisticsDB{GetLatestShiftTeamSchedulesInServiceRegionErr: errors.New("my errors are arbitrary nyehehe")},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{LogisticsDB: tc.MockDB}
			resp, err := s.GetServiceRegionSchedule(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
			testutils.MustMatch(t, tc.Output, resp, "output does not match expected output")
		})
	}
}

func TestCollectMetricsForGetServiceRegionSchedule(t *testing.T) {
	validDateSchedules := []*logisticspb.ServiceRegionDateSchedule{
		{
			UnassignableVisits: make([]*logisticspb.UnassignableVisit, 2),
			PendingUpdates: &logisticspb.SchedulePendingUpdates{
				RestBreakRequests: make([]*logisticspb.ShiftTeamRestBreakRequest, 4),
			},
			Schedules: []*logisticspb.ShiftTeamSchedule{
				{
					ShiftTeamId: 12345,
					Route: &logisticspb.ShiftTeamRoute{
						Stops: make([]*logisticspb.ShiftTeamRouteStop, 10),
					},
				},
			},
		},
		{
			UnassignableVisits: make([]*logisticspb.UnassignableVisit, 2),
			PendingUpdates: &logisticspb.SchedulePendingUpdates{
				RestBreakRequests: make([]*logisticspb.ShiftTeamRestBreakRequest, 4),
			},
			Schedules: []*logisticspb.ShiftTeamSchedule{
				{
					ShiftTeamId: 12345,
					Route: &logisticspb.ShiftTeamRoute{
						Stops: make([]*logisticspb.ShiftTeamRouteStop, 10),
					},
				},
			},
		},
		// Test Empty ShiftTeamSchedules does not add to total
		{
			UnassignableVisits: []*logisticspb.UnassignableVisit{},
			PendingUpdates:     &logisticspb.SchedulePendingUpdates{},
			Schedules:          []*logisticspb.ShiftTeamSchedule{},
		},
	}

	got := collectMetricsForGetServiceRegionSchedule(validDateSchedules)
	want := monitoring.Fields{
		unassignedVisitsField:  4,
		shiftTeamsField:        2,
		numVisitsField:         20,
		pendingRestBreaksField: 8,
	}
	testutils.MustMatch(t, want, got)
}

func TestDateForCheckFeasibilityVisit(t *testing.T) {
	ianaTimeZoneName := "America/Denver"

	startTime := time.Date(2022, time.January, 17, 17, 0, 0, 0, time.UTC)
	endTime := startTime.Add(time.Hour * 1)
	endTimeInvalid := startTime.Add(time.Hour * 24)
	arrivalDate := logisticsdb.TimestampFromDateTimeLoc(startTime, time.Time{}, time.UTC)

	// These start/end times cross the day boundary in UTC, but not in America/Denver
	beforeUTCMidnight := time.Date(2022, time.January, 17, 23, 0, 0, 0, time.UTC)
	afterUTCMidnight := beforeUTCMidnight.Add(time.Hour * 3)

	tcs := []struct {
		Desc                  string
		CheckFeasibilityVisit *logisticspb.CheckFeasibilityVisit
		IanaTimezone          string

		Date     *time.Time
		HasError bool
	}{
		{
			Desc: "valid arrival window",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: &commonpb.TimeWindow{
						StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
						EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
					},
				},
			},
			IanaTimezone: ianaTimeZoneName,
			Date:         &arrivalDate,
		},
		{
			Desc: "valid arrival date",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalDate{
					ArrivalDate: logisticsdb.TimeToProtoDate(&startTime),
				},
			},
			IanaTimezone: ianaTimeZoneName,
			Date:         &arrivalDate,
		},
		{
			Desc: "invalid arrival window",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: &commonpb.TimeWindow{
						StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
						EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimeInvalid),
					},
				},
			},

			HasError: true,
		},
		{
			Desc:                  "no window or date",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{},

			HasError: true,
		},
		{
			Desc: "timezone does not exist",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: &commonpb.TimeWindow{
						StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
						EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
					},
				},
			},
			IanaTimezone: "Utopia/Cityopolis",

			HasError: true,
		},
		{
			Desc: "invalid time window in UTC but valid in local timezone",
			CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: &commonpb.TimeWindow{
						StartDatetime: logisticsdb.TimeToProtoDateTime(&beforeUTCMidnight),
						EndDatetime:   logisticsdb.TimeToProtoDateTime(&afterUTCMidnight),
					},
				},
			},
			IanaTimezone: ianaTimeZoneName,

			Date: &arrivalDate,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			date, err := dateForCheckFeasibilityVisit(tc.CheckFeasibilityVisit, tc.IanaTimezone)
			if (err != nil) != tc.HasError {
				t.Fatalf("got err != nil %t, want %t, error is %s", err != nil, tc.HasError, err)
			}

			if tc.HasError {
				return
			}

			testutils.MustMatch(t, tc.Date.Format(dateLayout), date.Format(dateLayout), "dates doesn't match")
		})
	}
}

func TestValidate(t *testing.T) {
	tcs := []struct {
		Desc   string
		Config GRPCServerConfig

		HasError bool
	}{
		{
			Desc:   "Base case",
			Config: GRPCServerConfig{MaxRestBreaksPerShiftTeamPerDay: 1},
		},
		{
			Desc:   "Many rest breaks",
			Config: GRPCServerConfig{MaxRestBreaksPerShiftTeamPerDay: 100},
		},
		{
			Desc:   "No rest breaks",
			Config: GRPCServerConfig{MaxRestBreaksPerShiftTeamPerDay: 0},

			HasError: true,
		},
		{
			Desc:   "Negative rest breaks",
			Config: GRPCServerConfig{MaxRestBreaksPerShiftTeamPerDay: -1},

			HasError: true,
		},
		{
			Desc:   "No rest breaks specified",
			Config: GRPCServerConfig{},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{Cfg: tc.Config}
			err := s.Validate()
			if (err != nil) != tc.HasError {
				t.Fatalf("got err != nil %t, want %t, error is %s", err != nil, tc.HasError, err)
			}
		})
	}
}

func TestGRPCServer_GetAssignableShiftTeams(t *testing.T) {
	ctx := context.Background()
	testTime := time.Now()

	validVRPAssignableShiftTeam := &optimizerpb.AssignableShiftTeam{
		Id: proto.Int64(1),
		AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
			StartTimestampSec: proto.Int64(1),
			EndTimestampSec:   proto.Int64(2),
		},
		Attributes: []*optimizerpb.VRPAttribute{
			{Id: "Test required Skill"},
		},
	}
	invalidVRPAssignableShiftTeam := &optimizerpb.AssignableShiftTeam{
		Id: proto.Int64(2),
		AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
			StartTimestampSec: proto.Int64(1),
			EndTimestampSec:   proto.Int64(2),
		},
		Attributes: []*optimizerpb.VRPAttribute{
			{Id: "Test missing required Skill"},
		},
	}

	mockOptimizerResponse := &optimizerpb.GetAssignableShiftTeamsResponse{
		ShiftTeams: []*optimizerpb.AssignableShiftTeamResult{
			{
				ShiftTeam:                   validVRPAssignableShiftTeam,
				Status:                      optimizerpb.AssignableShiftTeamResult_STATUS_ASSIGNABLE.Enum(),
				TimeWindowStatus:            optimizerpb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_NO_OVERLAP.Enum(),
				MissingRequiredAttributes:   []*optimizerpb.VRPAttribute{},
				MissingPreferredAttributes:  []*optimizerpb.VRPAttribute{},
				IncludedForbiddenAttributes: []*optimizerpb.VRPAttribute{},
				IncludedUnwantedAttributes:  []*optimizerpb.VRPAttribute{},
			},
			{
				ShiftTeam:                   invalidVRPAssignableShiftTeam,
				Status:                      optimizerpb.AssignableShiftTeamResult_STATUS_NOT_ASSIGNABLE.Enum(),
				TimeWindowStatus:            optimizerpb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_OVERLAP.Enum(),
				MissingRequiredAttributes:   invalidVRPAssignableShiftTeam.Attributes,
				MissingPreferredAttributes:  []*optimizerpb.VRPAttribute{},
				IncludedForbiddenAttributes: []*optimizerpb.VRPAttribute{},
				IncludedUnwantedAttributes:  []*optimizerpb.VRPAttribute{},
			},
		},
	}

	tcs := []struct {
		Desc                 string
		MockDB               *MockLogisticsDB
		MockOptimizerService *MockOptimizerService
		Req                  *logisticspb.GetAssignableShiftTeamsRequest

		HasErr bool
	}{
		{
			Desc: "Get a list of assignable Shift Teams",
			MockDB: &MockLogisticsDB{
				GetAssignableShiftTeamCandidatesForDateResult: []*optimizerpb.AssignableShiftTeam{
					validVRPAssignableShiftTeam,
					invalidVRPAssignableShiftTeam,
				},
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{
					IanaTimeZoneName: "America/Denver",
				},
			},
			MockOptimizerService: &MockOptimizerService{
				mockGetAssignableShiftTeamsResp: mockOptimizerResponse,
			},
			Req: &logisticspb.GetAssignableShiftTeamsRequest{
				Visit: &logisticspb.AssignableVisit{
					Id:       proto.Int64(1),
					MarketId: proto.Int64(1),
					TimeWindow: &commonpb.TimeWindow{
						StartDatetime: logisticsdb.TimeToProtoDateTime(&testTime),
						EndDatetime:   logisticsdb.TimeToProtoDateTime(&testTime),
					},
					RequiredAttributes: []*commonpb.Attribute{
						{Name: "Test required Skill"},
					},
					PreferredAttributes: []*commonpb.Attribute{},
					ForbiddenAttributes: []*commonpb.Attribute{},
					UnwantedAttributes: []*commonpb.Attribute{
						{Name: "Test unwanted Skill"},
					},
				},
			},

			HasErr: false,
		},
		{
			Desc:   "nil visit request return an error",
			Req:    &logisticspb.GetAssignableShiftTeamsRequest{},
			HasErr: true,
		},
		{
			Desc: "nil market id on visit request return an error",
			Req: &logisticspb.GetAssignableShiftTeamsRequest{
				Visit: &logisticspb.AssignableVisit{
					Id:                  proto.Int64(1),
					RequiredAttributes:  []*commonpb.Attribute{},
					PreferredAttributes: []*commonpb.Attribute{},
					ForbiddenAttributes: []*commonpb.Attribute{},
					UnwantedAttributes:  []*commonpb.Attribute{},
					TimeWindow: &commonpb.TimeWindow{
						StartDatetime: &commonpb.DateTime{
							Year:  2022,
							Month: 1,
							Day:   1,
						},
						EndDatetime: &commonpb.DateTime{
							Year:  2022,
							Month: 1,
							Day:   1,
						},
					},
				},
			},
			HasErr: true,
		},
		{
			Desc: "null time window return an error",
			Req: &logisticspb.GetAssignableShiftTeamsRequest{
				Visit: &logisticspb.AssignableVisit{
					Id:                  proto.Int64(1),
					MarketId:            proto.Int64(1),
					RequiredAttributes:  []*commonpb.Attribute{},
					PreferredAttributes: []*commonpb.Attribute{},
					ForbiddenAttributes: []*commonpb.Attribute{},
					UnwantedAttributes:  []*commonpb.Attribute{},
				},
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{LogisticsDB: tc.MockDB, OptimizerService: tc.MockOptimizerService}

			result, err := s.GetAssignableShiftTeams(ctx, tc.Req)

			testutils.MustMatch(t, tc.HasErr, err != nil, "not error expected")
			if tc.HasErr {
				return
			}
			for i, shiftTeamResult := range result.ShiftTeams {
				expectedShiftTeamResult := mockOptimizerResponse.ShiftTeams[i]
				testutils.MustMatch(t, expectedShiftTeamResult.ShiftTeam.Id, shiftTeamResult.ShiftTeam.Id, "Shift Team Ids not matching")
				testutils.MustMatch(t, logisticsdb.OptimizerAssignableStatusToLogisticsAssignableStatus[*expectedShiftTeamResult.Status].Enum(), shiftTeamResult.Status, "not matching status")
				testutils.MustMatch(t, logisticsdb.OptimizerTimeWindowStatusToLogisticsTimeWindowStatus[*expectedShiftTeamResult.TimeWindowStatus].Enum(), shiftTeamResult.TimeWindowStatus, "not matching time window status")
			}
		})
	}
}

func TestGRPCServer_GetCareRequestsDiagnostics(t *testing.T) {
	var careRequestIDTest int64 = 1
	now := time.Now()
	nowHourAgo := now.Add(-time.Hour * 1)
	tcs := []struct {
		Desc   string
		Input  *logisticspb.GetCareRequestsDiagnosticsRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc: "base case",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{careRequestIDTest},
			},
			MockDB: &MockLogisticsDB{
				GetLatestCareRequestsDataForDiagnosticsResult: []*logisticsdb.CareRequestDiagnostics{
					{
						CareRequestID: &careRequestIDTest,
					},
				},
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "without care requests",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{},
			},

			ExpectedStatusCode: codes.InvalidArgument,
		},
		{
			Desc: "care request not found",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{careRequestIDTest},
			},
			MockDB: &MockLogisticsDB{
				GetLatestCareRequestsDataForDiagnosticsResult: []*logisticsdb.CareRequestDiagnostics{},
			},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc: "error getting diagnostics",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{careRequestIDTest},
			}, MockDB: &MockLogisticsDB{
				GetLatestCareRequestsDataForDiagnosticsError: errors.New("error diagnostics"),
			},

			ExpectedStatusCode: codes.Internal,
		},
		{
			Desc: "created before now",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{careRequestIDTest},
				CreatedBefore:  logisticsdb.TimeToProtoDateTime(&now),
			},
			MockDB: &MockLogisticsDB{
				GetLatestCareRequestsDataForDiagnosticsResult: []*logisticsdb.CareRequestDiagnostics{
					{
						CareRequestID: &careRequestIDTest,
					},
				},
			},

			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "created before an hour ago not found",
			Input: &logisticspb.GetCareRequestsDiagnosticsRequest{
				CareRequestIds: []int64{careRequestIDTest},
				CreatedBefore:  logisticsdb.TimeToProtoDateTime(&nowHourAgo),
			},
			MockDB: &MockLogisticsDB{
				GetLatestCareRequestsDataForDiagnosticsResult: []*logisticsdb.CareRequestDiagnostics{},
			},

			ExpectedStatusCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{
				LogisticsDB: tc.MockDB,
			}
			_, err := s.GetCareRequestsDiagnostics(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
		})
	}
}

func TestGRPCServer_GetMarketDiagnostics(t *testing.T) {
	serviceRegionID := int64(2)
	availAttrName := "some-attr-name"
	availAttrVariants := []string{"variant1", "variant2"}
	shiftTeamAttrs := []string{"shift-team-attribute"}
	capacityPercentForHorizonDays := []int32{1, 100}
	resp := &logisticspb.MarketDiagnostics{
		MarketId:        1,
		Lv1Launchable:   true,
		Lv1UiEnabled:    true,
		MarketShortName: proto.String("SOME_MKT"),
		ServiceRegionId: proto.Int64(serviceRegionID),
		Sync: &logisticspb.MarketDiagnostics_Sync{
			Enabled:      true,
			ShiftTeams:   true,
			CareRequests: true,
		},
		OptimizerRuns: &logisticspb.MarketDiagnostics_OptimizerRuns{
			Enabled:           true,
			HorizonDays:       3,
			PollIntervalSec:   4,
			OptimizerConfigId: 5,
		},
		AvailabilityRuns: &logisticspb.MarketDiagnostics_AvailabilityRuns{
			Enabled:         true,
			PollIntervalSec: 60,
			Attributes: []*logisticspb.MarketDiagnostics_AvailabilityRuns_Attributes{
				{
					Name:     availAttrName,
					Variants: availAttrVariants,
				},
			},
			CapacitySettings: []*logisticspb.MarketDiagnostics_AvailabilityRuns_CapacitySettings{
				{
					ShiftTeamAttributes:           shiftTeamAttrs,
					CapacityPercentForHorizonDays: capacityPercentForHorizonDays,
				},
			},
		},
		Feasibility: &logisticspb.MarketDiagnostics_Feasibility{
			Enabled: true,
			Locations: &logisticspb.CanonicalLocations{
				Locations: []*commonpb.Location{
					{
						LatitudeE6:  123,
						LongitudeE6: 456,
					},
				},
			},
			MinVisitDurationSec: 1234,
			MaxVisitDurationSec: 4321,
		},
		Schedule: &logisticspb.MarketDiagnostics_Schedule{
			Enabled: true,
			Days: []*commonpb.ScheduleDay{
				{
					DayOfWeek: 0,
				},
				{
					DayOfWeek: 1,
				},
				{
					DayOfWeek: 2,
				},
				{
					DayOfWeek: 3,
				},
				{
					DayOfWeek: 4,
				},
				{
					DayOfWeek: 5,
				},
				{
					DayOfWeek: 6,
				},
			},
		},
	}

	provider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{
		SDKKey:         "dummy",
		DefaultUserKey: "dummy",
		LocalMode:      true,
	})
	if err != nil {
		t.Fatal(err)
	}
	provider.Start()

	tcs := []struct {
		Desc             string
		Input            *logisticspb.GetMarketDiagnosticsRequest
		MockDB           *MockLogisticsDB
		SettingsService  *optimizersettings.MockSettingsService
		SyncSettings     *statsigSyncJSON
		UIMarketSettings *statsigUILaunchedMarketsJSON

		ExpectedStatusCode codes.Code
		ExpectedResponse   *logisticspb.GetMarketDiagnosticsResponse
	}{
		{
			Desc: "base case",
			Input: &logisticspb.GetMarketDiagnosticsRequest{
				MarketId: resp.MarketId,
			},
			MockDB: &MockLogisticsDB{
				GetMarketForStationMarketIDResult: &logisticssql.Market{
					StationMarketID: resp.MarketId,
					ShortName:       *resp.MarketShortName,
					ServiceRegionID: *resp.ServiceRegionId,
				},
				GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{
					ID: *resp.ServiceRegionId,
				},
				GetServiceRegionCanonicalLocationsResult: []*logisticssql.Location{
					{
						LatitudeE6:  resp.GetFeasibility().GetLocations().Locations[0].LatitudeE6,
						LongitudeE6: resp.GetFeasibility().GetLocations().Locations[0].LongitudeE6,
					},
				},
				GetServiceRegionVisitDurationsResult: logisticsdb.VisitServiceDurations{
					logisticsdb.MinVisitServiceDurationKey: time.Duration(resp.GetFeasibility().MinVisitDurationSec) * time.Second,
					logisticsdb.MaxVisitServiceDurationKey: time.Duration(resp.GetFeasibility().MaxVisitDurationSec) * time.Second,
				},
				GetOpenHoursScheduleForServiceRegionResult: resp.Schedule.Days,
			},
			SettingsService: &optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						serviceRegionID: optimizersettings.Settings{
							PollIntervalSec:     resp.OptimizerRuns.PollIntervalSec,
							OptimizeHorizonDays: resp.OptimizerRuns.HorizonDays,
							OptimizerConfigID:   resp.OptimizerRuns.OptimizerConfigId,
						},
					},
					AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
						serviceRegionID: optimizersettings.AvailabilitySettings{
							PollIntervalSec: resp.AvailabilityRuns.PollIntervalSec,
							Attributes: []optimizersettings.AvailabilityAttribute{
								{
									Name:     availAttrName,
									Variants: availAttrVariants,
								},
							},
							CapacitySettings: []*optimizersettings.CapacitySettings{
								{
									ShiftTeamAttributes:           shiftTeamAttrs,
									CapacityPercentForHorizonDays: capacityPercentForHorizonDays,
								},
							},
						},
					},
				},
			},
			SyncSettings: &statsigSyncJSON{
				EnableGoMarketShortNames: []string{
					resp.GetMarketShortName(),
				},
			},
			UIMarketSettings: &statsigUILaunchedMarketsJSON{
				LaunchedMarketShortNames: []string{
					resp.GetMarketShortName(),
				},
			},

			ExpectedStatusCode: codes.OK,
			ExpectedResponse: &logisticspb.GetMarketDiagnosticsResponse{
				Market: resp,
			},
		},
		{
			Desc: "no market id",
			Input: &logisticspb.GetMarketDiagnosticsRequest{
				MarketId: 0,
			},

			ExpectedStatusCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			err = provider.OverrideStruct(syncCareReqsStatsigKey, tc.SyncSettings)
			if err != nil {
				t.Fatal(err)
			}
			err = provider.OverrideStruct(syncShiftTeamsStatsigKey, tc.SyncSettings)
			if err != nil {
				t.Fatal(err)
			}
			err = provider.OverrideStruct(uiLaunchedMarketsStatsigKey, tc.UIMarketSettings)
			if err != nil {
				t.Fatal(err)
			}

			s := GRPCServer{
				LogisticsDB:     tc.MockDB,
				SettingsService: tc.SettingsService,
				StatsigProvider: provider,
			}
			resp, err := s.GetMarketDiagnostics(context.Background(), tc.Input)
			testutils.MustMatch(t, tc.ExpectedStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.ExpectedResponse, resp)
		})
	}
}

func TestGRPCServer_UpdateMarketFeasibilityCheckSettings(t *testing.T) {
	validLDB := &MockLogisticsDB{
		GetServiceRegionForStationMarketIDResult:       &logisticssql.ServiceRegion{},
		UpdateServiceRegionFeasibilityCheckSettingsErr: nil,
	}
	req := &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
		MarketId:            1,
		MinVisitDurationSec: proto.Int64(1234),
		MaxVisitDurationSec: proto.Int64(4321),

		Data: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_Locations{
			Locations: &logisticspb.CanonicalLocations{
				Locations: []*commonpb.Location{
					{
						LatitudeE6:  123,
						LongitudeE6: 456,
					},
				},
			},
		},
	}

	tcs := []struct {
		Desc string
		Req  *logisticspb.UpdateMarketFeasibilityCheckSettingsRequest
		LDB  LogisticsDB

		ErrCode codes.Code
	}{
		{
			Desc: "base case",
			Req:  req,
			LDB:  validLDB,
		},
		{
			Desc: "base case, no min/max visit duration",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: nil,
				MaxVisitDurationSec: nil,
				Data:                req.Data,
			},
			LDB: validLDB,
		},
		{
			Desc: "no market id",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            0,
				MinVisitDurationSec: req.MinVisitDurationSec,
				Data:                req.Data,
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "0 min visit duration",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: proto.Int64(0),
				Data:                req.Data,
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "0 max visit duration",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: proto.Int64(1),
				MaxVisitDurationSec: proto.Int64(0),
				Data:                req.Data,
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "lower max visit duration",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: proto.Int64(10),
				MaxVisitDurationSec: proto.Int64(1),
				Data:                req.Data,
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "no data",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: req.MinVisitDurationSec,
				Data:                nil,
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "no service region for market id",
			Req:  req,
			LDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDErr: errors.New("bad mkt"),
			},

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "update locations fails",
			Req:  req,
			LDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDResult:       &logisticssql.ServiceRegion{},
				UpdateServiceRegionFeasibilityCheckSettingsErr: errors.New("no update"),
			},

			ErrCode: codes.Internal,
		},
		{
			Desc: "no locations",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: req.MinVisitDurationSec,
				Data: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_Locations{
					Locations: &logisticspb.CanonicalLocations{
						Locations: []*commonpb.Location{},
					},
				},
			},
			LDB: validLDB,

			ErrCode: codes.InvalidArgument,
		},
		{
			Desc: "good csv",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId:            req.MarketId,
				MinVisitDurationSec: req.MinVisitDurationSec,
				Data: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_CsvData{
					CsvData: []byte(`
latitude,longitude
1.23,4.56`),
				},
			},
			LDB: validLDB,
		},
		{
			Desc: "bad csv",
			Req: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest{
				MarketId: req.MarketId,
				Data: &logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_CsvData{
					CsvData: []byte("bad csv"),
				},
				MinVisitDurationSec: req.MinVisitDurationSec,
			},
			LDB: validLDB,

			ErrCode: codes.InvalidArgument,
		},
	}

	ctx := context.Background()
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{
				LogisticsDB: tc.LDB,
			}

			_, err := s.UpdateMarketFeasibilityCheckSettings(ctx, tc.Req)
			testutils.MustMatch(t, tc.ErrCode, status.Code(err))
		})
	}
}

func TestGRPCServer_GetCheckFeasibilityCareRequestHistory(t *testing.T) {
	var careRequestIDTest int64 = 1
	var careRequestBadIDTest int64

	tcs := []struct {
		Desc   string
		Input  *logisticspb.GetCheckFeasibilityCareRequestHistoryRequest
		MockDB *MockLogisticsDB

		ExpectedStatusCode codes.Code
	}{
		{
			Desc: "base case",
			Input: &logisticspb.GetCheckFeasibilityCareRequestHistoryRequest{
				CareRequestId: careRequestIDTest,
			},
			MockDB: &MockLogisticsDB{
				GetCheckFeasibilityCareRequestHistoryResult: []*logisticspb.CheckFeasibilityCareRequestDiagnostic{
					{Problem: &optimizerpb.VRPProblem{}, Solution: &optimizerpb.VRPSolution{}, CreatedAt: timestamppb.New(time.Now())},
				},
			},
			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "multiple results",
			Input: &logisticspb.GetCheckFeasibilityCareRequestHistoryRequest{
				CareRequestId: careRequestIDTest,
			},
			MockDB: &MockLogisticsDB{
				GetCheckFeasibilityCareRequestHistoryResult: []*logisticspb.CheckFeasibilityCareRequestDiagnostic{
					{Problem: &optimizerpb.VRPProblem{}, Solution: &optimizerpb.VRPSolution{}, CreatedAt: timestamppb.New(time.Now())},
					{Problem: &optimizerpb.VRPProblem{}, Solution: &optimizerpb.VRPSolution{}, CreatedAt: timestamppb.New(time.Now())},
				},
			},
			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "empty result",
			Input: &logisticspb.GetCheckFeasibilityCareRequestHistoryRequest{
				CareRequestId: careRequestIDTest,
			},
			MockDB: &MockLogisticsDB{
				GetCheckFeasibilityCareRequestHistoryResult: []*logisticspb.CheckFeasibilityCareRequestDiagnostic{},
			},
			ExpectedStatusCode: codes.OK,
		},
		{
			Desc: "error, invalid id",
			Input: &logisticspb.GetCheckFeasibilityCareRequestHistoryRequest{
				CareRequestId: careRequestBadIDTest,
			},
			ExpectedStatusCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{
				LogisticsDB: tc.MockDB,
			}
			_, err := s.GetCheckFeasibilityCareRequestHistory(context.Background(), tc.Input)
			if status.Code(err) != tc.ExpectedStatusCode {
				t.Errorf("%s got;  want %s", status.Code(err), tc.ExpectedStatusCode)
			}
		})
	}
}

func TestGRPCServer_GetAssignableVisits(t *testing.T) {
	ctx := context.Background()
	testTime := time.Now()

	marketID := int64(1)

	assignableVisit := &optimizerpb.AssignableVisit{
		Id: proto.Int64(1),
		ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
			StartTimestampSec: proto.Int64(1),
			EndTimestampSec:   proto.Int64(2),
		},
		RequiredAttributes: []*optimizerpb.VRPAttribute{
			{Id: "Test required Skill"},
		},
		PreferredAttributes: []*optimizerpb.VRPAttribute{
			{Id: "Test preferred Skill"},
		},
		ForbiddenAttributes: []*optimizerpb.VRPAttribute{
			{Id: "Test forbidden Skill"},
		},
		UnwantedAttributes: []*optimizerpb.VRPAttribute{
			{Id: "Test unwanted Skill"},
		},
	}

	optimizerAssignableVisitResult := &optimizerpb.AssignableVisitResult{
		Visit:                       assignableVisit,
		Status:                      optimizerpb.AssignableStatus_ASSIGNABLE_STATUS_ASSIGNABLE,
		TimeWindowStatus:            optimizerpb.AssignableTimeWindowStatus_ASSIGNABLE_TIME_WINDOW_STATUS_NO_OVERLAP,
		MissingRequiredAttributes:   []*optimizerpb.VRPAttribute{},
		MissingPreferredAttributes:  []*optimizerpb.VRPAttribute{},
		IncludedForbiddenAttributes: []*optimizerpb.VRPAttribute{},
		IncludedUnwantedAttributes:  []*optimizerpb.VRPAttribute{},
	}

	optimizerUnassignableVisitResult := &optimizerpb.AssignableVisitResult{
		Visit:                       assignableVisit,
		Status:                      optimizerpb.AssignableStatus_ASSIGNABLE_STATUS_NOT_ASSIGNABLE,
		TimeWindowStatus:            optimizerpb.AssignableTimeWindowStatus_ASSIGNABLE_TIME_WINDOW_STATUS_NO_OVERLAP,
		MissingRequiredAttributes:   []*optimizerpb.VRPAttribute{},
		MissingPreferredAttributes:  []*optimizerpb.VRPAttribute{},
		IncludedForbiddenAttributes: []*optimizerpb.VRPAttribute{},
		IncludedUnwantedAttributes:  []*optimizerpb.VRPAttribute{},
	}

	optimizerOverrideAssignableVisitResult := &optimizerpb.AssignableVisitResult{
		Visit:                       assignableVisit,
		Status:                      optimizerpb.AssignableStatus_ASSIGNABLE_STATUS_OVERRIDE_ASSIGNABLE,
		TimeWindowStatus:            optimizerpb.AssignableTimeWindowStatus_ASSIGNABLE_TIME_WINDOW_STATUS_NO_OVERLAP,
		MissingRequiredAttributes:   []*optimizerpb.VRPAttribute{},
		MissingPreferredAttributes:  []*optimizerpb.VRPAttribute{},
		IncludedForbiddenAttributes: []*optimizerpb.VRPAttribute{},
		IncludedUnwantedAttributes:  []*optimizerpb.VRPAttribute{},
	}

	mockOptimizerResponse := &optimizerpb.GetAssignableVisitsResponse{
		Visits: []*optimizerpb.AssignableVisitResult{
			optimizerAssignableVisitResult,
			optimizerUnassignableVisitResult,
			optimizerOverrideAssignableVisitResult,
		},
	}

	tcs := []struct {
		Desc                 string
		MockDB               *MockLogisticsDB
		MockOptimizerService *MockOptimizerService
		Req                  *logisticspb.GetAssignableVisitsRequest

		NumAssignableVisits int
		HasErr              bool
	}{
		{
			Desc: "request without MarketIds",
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds: []int64{},
			},

			HasErr: true,
		},
		{
			Desc: "request without LatestVisitPhases",
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds:   []int64{marketID},
				VisitPhases: []logisticspb.VisitPhase{},
			},

			HasErr: true,
		},
		{
			Desc: "request without LatestVirtualAppVisitPhases",
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds: []int64{marketID},
				VisitPhases: []logisticspb.VisitPhase{
					logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
					logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
				},
				VirtualAppVisitPhases: []logisticspb.VirtualAPPVisitPhase{},
			},

			HasErr: true,
		},
		{
			Desc: "request without Attributes",
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds: []int64{marketID},
				VisitPhases: []logisticspb.VisitPhase{
					logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
					logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
				},
				VirtualAppVisitPhases: []logisticspb.VirtualAPPVisitPhase{
					logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
				},
				ShiftTeamAttributes: []*commonpb.Attribute{},
			},

			HasErr: true,
		},
		{
			Desc: "request without TimeWindow",
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds: []int64{marketID},
				VisitPhases: []logisticspb.VisitPhase{
					logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
					logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
				},
				VirtualAppVisitPhases: []logisticspb.VirtualAPPVisitPhase{
					logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
				},
				ShiftTeamAttributes: []*commonpb.Attribute{
					{Name: "Test Skill"},
				},
				TimeWindow: nil,
			},

			HasErr: true,
		},
		{
			Desc: "return only when statuses override assignable and assignable",
			MockDB: &MockLogisticsDB{
				GetAssignableVisitsForDateResult: []*optimizerpb.AssignableVisit{
					optimizerAssignableVisitResult.Visit,
					optimizerUnassignableVisitResult.Visit,
					optimizerOverrideAssignableVisitResult.Visit,
				},
			},
			MockOptimizerService: &MockOptimizerService{
				mockGetAssignableVisitsResp: mockOptimizerResponse,
			},
			Req: &logisticspb.GetAssignableVisitsRequest{
				MarketIds: []int64{marketID},
				VisitPhases: []logisticspb.VisitPhase{
					logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
					logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
				},
				VirtualAppVisitPhases: []logisticspb.VirtualAPPVisitPhase{
					logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
				},
				ShiftTeamAttributes: []*commonpb.Attribute{
					{Name: "Test Skill"},
				},
				TimeWindow: &commonpb.TimeWindow{
					StartDatetime: logisticsdb.TimeToProtoDateTime(&testTime),
					EndDatetime:   logisticsdb.TimeToProtoDateTime(&testTime),
				},
			},

			NumAssignableVisits: 2,
			HasErr:              false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{LogisticsDB: tc.MockDB, OptimizerService: tc.MockOptimizerService}
			response, err := s.GetAssignableVisits(ctx, tc.Req)
			testutils.MustMatch(t, tc.HasErr, err != nil, "no error expected")
			if tc.HasErr {
				return
			}

			testutils.MustMatch(t, tc.NumAssignableVisits, len(response.Visits), "number of assignable visits does not match")
		})
	}
}

func TestGRPCServer_CompareScheduleCounterfactual(t *testing.T) {
	ctx := context.Background()
	baseID := time.Now().UnixNano()
	scheduleID := baseID
	careRequestID := baseID + 1
	shiftTeamID := baseID + 2
	routeHistoryVisitID := baseID + 3
	careRequestIDForUnpairing := baseID + 4

	scheduleToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
	if err != nil {
		t.Fatal(err)
	}

	problemData := &logisticsdb.VRPProblemData{
		VRPProblem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{
			// NOTE: careRequestID != visitID in general... but it's okay for this test case.
			ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(shiftTeamID), RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
				Stops: []*optimizerpb.VRPShiftTeamRouteStop{
					{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(routeHistoryVisitID)}}}},
			}}},
			Visits: []*optimizerpb.VRPVisit{
				{Id: proto.Int64(careRequestID)},
				{Id: proto.Int64(routeHistoryVisitID)},
				{Id: proto.Int64(careRequestIDForUnpairing)},
			},
		}},
		// identity mappings simply for test coverage
		EntityMappings: logisticsdb.EntityMappings{
			CareRequests: map[logisticsdb.VisitSnapshotID]logisticsdb.CareRequestID{
				logisticsdb.VisitSnapshotID(careRequestID):             logisticsdb.CareRequestID(careRequestID),
				logisticsdb.VisitSnapshotID(routeHistoryVisitID):       logisticsdb.CareRequestID(routeHistoryVisitID),
				logisticsdb.VisitSnapshotID(careRequestIDForUnpairing): logisticsdb.CareRequestID(careRequestIDForUnpairing),
			},
			ShiftTeams: map[logisticsdb.ShiftTeamSnapshotID]logisticsdb.ShiftTeamID{
				logisticsdb.ShiftTeamSnapshotID(shiftTeamID): logisticsdb.ShiftTeamID(shiftTeamID),
			},
		},
	}

	date := time.Date(2023, 5, 9, 0, 0, 0, 0, time.UTC)
	schedule := &logisticsdb.ScheduleAndDebugScore{
		Schedule: &logisticspb.ServiceRegionDateSchedule{
			Meta: &logisticspb.ScheduleMetadata{
				ServiceDate: protoconv.TimeToProtoDate(&date),
			},
			Schedules: []*logisticspb.ShiftTeamSchedule{
				{ShiftTeamId: shiftTeamID, Route: &logisticspb.ShiftTeamRoute{Stops: []*logisticspb.ShiftTeamRouteStop{
					{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
						Visit: &logisticspb.ShiftTeamVisit{CareRequestId: proto.Int64(careRequestID)},
					}},
				}}},
			}},
		Score: &optimizerpb.VRPScore{
			IsValid:               proto.Bool(true),
			HardScore:             proto.Int64(1),
			MediumScore:           proto.Int64(2),
			SoftScore:             proto.Int64(3),
			UnassignedVisitsScore: proto.Int64(4),
			DebugExplanation:      proto.String("debug_explanation"),
		},
	}

	validLDB := &MockLogisticsDB{
		GetShiftTeamsSchedulesFromScheduleIDResult: schedule,
		VRPProblemDataForScheduleResult:            problemData,
	}
	validReq := &logisticspb.CompareScheduleCounterfactualRequest{
		ScheduleToken: scheduleToken,
		AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
			{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{CareRequestId: careRequestID, ShiftTeamId: shiftTeamID}}},
			{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{CareRequestId: careRequestIDForUnpairing, ShiftTeamId: shiftTeamID}}},
		},
	}
	validVRPSolver := &MockVRPSolver{
		hardScores:   []int64{0},
		isValidScore: true,
	}

	tcs := []struct {
		Desc      string
		Req       *logisticspb.CompareScheduleCounterfactualRequest
		LDB       LogisticsDB
		VRPSolver checkfeasibility.VRPSolver

		ExpectedCode codes.Code
	}{
		{
			Desc:      "base case",
			LDB:       validLDB,
			Req:       validReq,
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.OK,
		},
		{
			Desc:      "valid request, but not found",
			LDB:       validLDB.WithVRPProblemDataForScheduleErr(logisticsdb.ErrScheduleNotFound),
			Req:       validReq,
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.NotFound,
		},
		{
			Desc:      "valid request, LDB internal error GetShiftTeamsSchedulesFromScheduleID",
			LDB:       validLDB.WithGetShiftTeamsSchedulesFromScheduleIDErr(errors.New("unknown error map to Internal")),
			Req:       validReq,
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.Internal,
		},
		{
			Desc:      "valid request, LDB internal error VRPProblemForSchedule",
			LDB:       validLDB.WithVRPProblemDataForScheduleErr(errors.New("unknown error maps to Internal")),
			Req:       validReq,
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.Internal,
		},
		{
			Desc:      "invalid request: nil",
			LDB:       validLDB,
			Req:       nil,
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc:      "invalid request: no schedule token",
			LDB:       validLDB,
			Req:       &logisticspb.CompareScheduleCounterfactualRequest{},
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc: "invalid request: invalid schedule token",
			LDB:  validLDB,
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: []byte{1, 2, 3},
			},
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc:      "invalid request: no additional constraints",
			LDB:       validLDB,
			Req:       &logisticspb.CompareScheduleCounterfactualRequest{ScheduleToken: scheduleToken},
			VRPSolver: validVRPSolver,

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc:      "inconsistent request: unknown ordering ID",
			LDB:       validLDB,
			VRPSolver: validVRPSolver,
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
						Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
							// a bad random ID.
							CareRequestIds: []int64{time.Now().UnixNano()}}}},
				},
			},

			ExpectedCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{LogisticsDB: tc.LDB, VRPSolver: validVRPSolver}
			resp, err := s.CompareScheduleCounterfactual(ctx, tc.Req)

			errVal := nilErr
			if err != nil {
				errVal = err.Error()
			}
			testutils.MustMatch(t, tc.ExpectedCode, status.Code(err), errVal)
			if tc.ExpectedCode == codes.OK {
				testutils.MustMatch(t, schedule.Schedule, resp.OriginalSchedule, "original schedule is mapped through correctly")
				testutils.MustMatch(t, schedule.Score, resp.OriginalScore, "original score is mapped through correctly")
				testutils.MustMatch(t, schedule.Score.GetDebugExplanation(), resp.OriginalScore.GetDebugExplanation(), "original schedule debug explanation is mapped through correctly")
			}
		})
	}
}

func TestValidateCounterfactualConstraintConsistency(t *testing.T) {
	baseID := time.Now().UnixNano()
	scheduleID := baseID
	careRequestID := baseID + 1
	shiftTeamID := baseID + 2
	routeHistoryVisitID := baseID + 3

	scheduleToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
	if err != nil {
		t.Fatal(err)
	}

	problemData := &logisticsdb.VRPProblemData{
		VRPProblem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{
			// NOTE: careRequestID != visitID in general... but it's okay for this test case.
			ShiftTeams: []*optimizerpb.VRPShiftTeam{{Id: proto.Int64(shiftTeamID), RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
				Stops: []*optimizerpb.VRPShiftTeamRouteStop{
					{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(routeHistoryVisitID)}}}},
			}}},
			Visits: []*optimizerpb.VRPVisit{{Id: proto.Int64(careRequestID)}},
		}},
		// identity mappings simply for test coverage
		EntityMappings: logisticsdb.EntityMappings{
			CareRequests: map[logisticsdb.VisitSnapshotID]logisticsdb.CareRequestID{
				logisticsdb.VisitSnapshotID(careRequestID):       logisticsdb.CareRequestID(careRequestID),
				logisticsdb.VisitSnapshotID(routeHistoryVisitID): logisticsdb.CareRequestID(routeHistoryVisitID),
			},
			ShiftTeams: map[logisticsdb.ShiftTeamSnapshotID]logisticsdb.ShiftTeamID{
				logisticsdb.ShiftTeamSnapshotID(shiftTeamID): logisticsdb.ShiftTeamID(shiftTeamID),
			},
		},
	}
	schedule := &logisticspb.ServiceRegionDateSchedule{Schedules: []*logisticspb.ShiftTeamSchedule{
		{ShiftTeamId: shiftTeamID, Route: &logisticspb.ShiftTeamRoute{Stops: []*logisticspb.ShiftTeamRouteStop{
			{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
				Visit: &logisticspb.ShiftTeamVisit{CareRequestId: proto.Int64(careRequestID)},
			}},
		}}},
	}}

	validReq := &logisticspb.CompareScheduleCounterfactualRequest{
		ScheduleToken: scheduleToken,
		AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
			{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{CareRequestId: careRequestID, ShiftTeamId: shiftTeamID}}},
			{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{CareRequestIds: []int64{careRequestID}}}},
		},
	}

	tcs := []struct {
		Desc string
		Req  *logisticspb.CompareScheduleCounterfactualRequest

		HasErr bool
	}{
		{
			Desc: "base case: valid",
			Req:  validReq,
		},
		{
			Desc: "inconsistent request: unknown ordering ID",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
						Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
							// a bad random ID.
							CareRequestIds: []int64{time.Now().UnixNano()}}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: doubly constrained ordering",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
						Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
							CareRequestIds: []int64{careRequestID}}}},
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
						Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
							CareRequestIds: []int64{careRequestID}}},
					},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: pairing and unpairing",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
						Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
							CareRequestId: careRequestID,
							ShiftTeamId:   shiftTeamID,
						}}},
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
						Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
							CareRequestId: careRequestID,
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: unpairing and pairing",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
						Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
							CareRequestId: careRequestID,
							ShiftTeamId:   shiftTeamID,
						}}},
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
						Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
							CareRequestId: careRequestID,
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: unpairing unknown shift team",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
						Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
							CareRequestId: careRequestID,
							// unknown shift team
							ShiftTeamId: time.Now().UnixNano(),
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: pairing unknown shift team",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
						Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
							CareRequestId: careRequestID,
							// unknown shift team
							ShiftTeamId: -123,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: unpairing unknown care request",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
						Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
							// unknown care request
							CareRequestId: time.Now().UnixNano(),
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: pairing unknown care request",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
						Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
							// unknown care request
							CareRequestId: time.Now().UnixNano(),
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: route history stop in pairing",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
						Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
							CareRequestId: routeHistoryVisitID,
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: route history stop in unpairing",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
						Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
							CareRequestId: routeHistoryVisitID,
							ShiftTeamId:   shiftTeamID,
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: route history stop in ordering",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
						Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
							CareRequestIds: []int64{routeHistoryVisitID},
						}}},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: unmapped type",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{Constraint: nil},
				},
			},

			HasErr: true,
		},
		{
			Desc: "inconsistent request: shiftTeamOverride unknown shift team",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{
						Constraint: &logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride_{
							ShiftTeamOverride: &logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride{
								// unknown shift team
								ShiftTeamId: time.Now().UnixNano(),
							},
						},
					},
				},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			err := validateCounterfactualConstraintConsistency(tc.Req, schedule, problemData)
			errVal := nilErr
			if err != nil {
				errVal = err.Error()
			}
			testutils.MustMatch(t, tc.HasErr, err != nil, errVal)
		})
	}
}

func TestApplyCounterfactualConstraintsToProblem(t *testing.T) {
	baseID := time.Now().UnixNano()
	scheduleID := baseID
	careRequestID := baseID + 1
	shiftTeamID := baseID + 2

	scheduleToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
	if err != nil {
		t.Fatal(err)
	}

	problemData := &logisticsdb.VRPProblemData{
		VRPProblem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{
			// NOTE: careRequestID != visitID in general... but it's okay for this test case.
			ShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Id: proto.Int64(shiftTeamID),
					AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
						StartTimestampSec: proto.Int64(0),
						EndTimestampSec:   proto.Int64(0),
					},
				},
			},
			Visits: []*optimizerpb.VRPVisit{{Id: proto.Int64(careRequestID)}},
		}},
		// identity mappings simply for test coverage
		EntityMappings: logisticsdb.EntityMappings{
			CareRequests: map[logisticsdb.VisitSnapshotID]logisticsdb.CareRequestID{
				logisticsdb.VisitSnapshotID(careRequestID): logisticsdb.CareRequestID(careRequestID),
			},
			ShiftTeams: map[logisticsdb.ShiftTeamSnapshotID]logisticsdb.ShiftTeamID{
				logisticsdb.ShiftTeamSnapshotID(shiftTeamID): logisticsdb.ShiftTeamID(shiftTeamID),
			},
		},
	}

	startTimestampSec := int64(10)
	endTimestampSec := int64(20)
	validReq := &logisticspb.CompareScheduleCounterfactualRequest{
		ScheduleToken: scheduleToken,
		AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
			// this is invalid to both pair + unpair in general, but it simplifies the test setup and is validated upstream of this function.
			{
				Constraint: &logisticspb.CounterfactualScheduleConstraint_Pairing_{
					Pairing: &logisticspb.CounterfactualScheduleConstraint_Pairing{
						CareRequestId: careRequestID,
						ShiftTeamId:   shiftTeamID,
					},
				},
			},
			{
				Constraint: &logisticspb.CounterfactualScheduleConstraint_Unpairing_{
					Unpairing: &logisticspb.CounterfactualScheduleConstraint_Unpairing{
						CareRequestId: careRequestID,
						ShiftTeamId:   shiftTeamID,
					},
				},
			},
			{
				Constraint: &logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride_{
					ShiftTeamOverride: &logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride{
						ShiftTeamId:       shiftTeamID,
						StartTimestampSec: startTimestampSec,
						EndTimestampSec:   endTimestampSec,
					},
				},
			},
		},
	}

	tcs := []struct {
		Desc string
		Req  *logisticspb.CompareScheduleCounterfactualRequest

		HasErr bool
	}{
		{
			Desc: "base case: valid",
			Req:  validReq,
		},
		{
			Desc: "ordering constraint is not yet handled",
			Req: &logisticspb.CompareScheduleCounterfactualRequest{
				ScheduleToken: scheduleToken,
				AdditionalScheduleConstraints: []*logisticspb.CounterfactualScheduleConstraint{
					{
						Constraint: &logisticspb.CounterfactualScheduleConstraint_Ordering_{
							Ordering: &logisticspb.CounterfactualScheduleConstraint_Ordering{
								CareRequestIds: []int64{careRequestID},
							},
						},
					},
				},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			copied, err := applyCounterfactualConstraintsToProblem(tc.Req, problemData)
			errVal := nilErr
			if err != nil {
				errVal = err.Error()
			}
			testutils.MustMatch(t, tc.HasErr, err != nil, errVal)
			if !tc.HasErr {
				requiredAttrs := copied.GetDescription().GetVisits()[0].GetRequiredAttributes()
				forbiddenAttrs := copied.GetDescription().GetVisits()[0].GetForbiddenAttributes()
				shiftTeamAttrs := copied.GetDescription().GetShiftTeams()[0].GetAttributes()
				shiftTeamAvailableTW := copied.GetDescription().GetShiftTeams()[0].GetAvailableTimeWindow()
				testutils.MustMatch(t,
					pairingAttribute(careRequestID, shiftTeamID),
					requiredAttrs[0],
					"pairing attribute results in the right required attribute on the visit",
				)
				testutils.MustMatch(t,
					unpairingAttribute(careRequestID, shiftTeamID),
					forbiddenAttrs[0],
					"unpairing attribute results in the right forbidden attribute on the visit",
				)
				testutils.MustMatch(t,
					[]*optimizerpb.VRPAttribute{
						pairingAttribute(careRequestID, shiftTeamID),
						unpairingAttribute(careRequestID, shiftTeamID),
					},
					shiftTeamAttrs,
					"and the shift team is marked with both the pairing and the unpairing attributes",
				)
				testutils.MustMatch(t,
					&optimizerpb.VRPTimeWindow{
						StartTimestampSec: proto.Int64(startTimestampSec),
						EndTimestampSec:   proto.Int64(endTimestampSec),
					},
					shiftTeamAvailableTW,
				)
			}
		})
	}
}

func TestGRPCServer_GetServiceRegionAvailability(t *testing.T) {
	marketID := time.Now().UnixNano()
	serviceDate := time.Date(2023, time.October, 31, 0, 0, 0, 0, time.UTC)
	validRequest := &logisticspb.GetServiceRegionAvailabilityRequest{
		MarketId:    proto.Int64(marketID),
		ServiceDate: protoconv.TimeToProtoDate(&serviceDate),
	}
	validRequestWithAttributes := &logisticspb.GetServiceRegionAvailabilityRequest{
		MarketId:    proto.Int64(marketID),
		ServiceDate: protoconv.TimeToProtoDate(&serviceDate),
		RequiredAttributesSets: []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet{
			{
				RequiredAttributes: []*commonpb.Attribute{
					{Name: "attribute"},
				},
			},
		},
	}

	tcs := []struct {
		Desc   string
		Req    *logisticspb.GetServiceRegionAvailabilityRequest
		MockDB *MockLogisticsDB

		ExpectedCode   codes.Code
		ExpectedStatus logisticspb.ServiceRegionAvailability_Status
	}{
		{
			Desc: "Success Available without attributes",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{},
								{},
								{},
								{},
								{},
							},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE,
		},
		{
			Desc: "Success Partial Available without attributes",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					CanonicalLocationsSetIDs: []int64{1, 2, 3},
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{
									LocationID: 1,
								},
								{
									LocationID: 2,
								},
							},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{},
								{},
								{},
							},
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_PARTIALLY_AVAILABLE,
		},
		{
			Desc: "Success Unavailable without attributes",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					CanonicalLocationsSetIDs: []int64{1},
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{},
								{},
								{},
								{},
								{},
							},
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
		},
		{
			Desc: "Success Unavailable with attributes",
			Req:  validRequestWithAttributes,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					CanonicalLocationsSetIDs: []int64{1},
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{
									LocationID: 1,
								},
							},
							UnassignedVisits:    []*logisticssql.ServiceRegionAvailabilityVisit{},
							VisitsAttributesMap: logisticsdb.VisitsAttributesMap{},
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
		},
		{
			Desc: "Success Available with attributes",
			Req:  validRequestWithAttributes,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{ID: 1},
								{ID: 2},
								{ID: 3},
								{ID: 4},
								{ID: 5},
							},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
							VisitsAttributesMap: logisticsdb.VisitsAttributesMap{
								1: {
									"attribute": true,
								},
								2: {
									"attribute": true,
								},
								3: {
									"attribute": true,
								},
								4: {
									"attribute": true,
								},
								5: {
									"attribute": true,
								},
							},
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE,
		},
		{
			Desc: "Success Unavailable with null values",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits:   nil,
							UnassignedVisits: nil,
						},
					},
				},
			},
			ExpectedCode:   codes.OK,
			ExpectedStatus: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
		},
		{
			Desc: "Fail DB error",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityErr: errors.New("mock error"),
			},
			ExpectedCode: codes.Internal,
		},
		{
			Desc: "Fail marketID is null",
			Req: &logisticspb.GetServiceRegionAvailabilityRequest{
				ServiceDate:            protoconv.TimeToProtoDate(&serviceDate),
				RequiredAttributesSets: []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet{},
			},

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc: "Fail Service Date is null",
			Req: &logisticspb.GetServiceRegionAvailabilityRequest{
				MarketId:               proto.Int64(marketID),
				RequiredAttributesSets: []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet{},
			},

			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc: "Fail problem storing availability queries",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{ID: 1},
								{ID: 2},
								{ID: 3},
								{ID: 4},
								{ID: 5},
							},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
							VisitsAttributesMap: logisticsdb.VisitsAttributesMap{
								1: {
									"attribute": true,
								},
								2: {
									"attribute": true,
								},
								3: {
									"attribute": true,
								},
								4: {
									"attribute": true,
								},
								5: {
									"attribute": true,
								},
							},
						},
					},
				},
				AddServiceRegionAvailabilityQueriesErr: errors.New("happy error"),
			},
			ExpectedCode: codes.Internal,
		},
		{
			Desc: "Fail storing availability query attributes",
			Req:  validRequest,
			MockDB: &MockLogisticsDB{
				ServiceRegionAvailabilityResult: &logisticsdb.ServiceRegionAvailability{
					Results: []logisticsdb.ServiceRegionAvailabilityResult{
						{
							ServiceDate: serviceDate,
							ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
								ScheduleID: 1,
							},
							AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
								{ID: 1},
							},
							UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
							VisitsAttributesMap: logisticsdb.VisitsAttributesMap{
								1: {
									"attribute": true,
								},
							},
						},
					},
				},
				AddServiceRegionAvailabilityQueriesResult: []*logisticssql.ServiceRegionAvailabilityQuery{
					{ID: 999},
				},
				AddServiceRegionAvailabilityQueryAttributesErr: errors.New("wild error appeared"),
			},
			ExpectedCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{
				LogisticsDB: tc.MockDB,
			}

			resp, err := s.GetServiceRegionAvailability(context.Background(), tc.Req)

			testutils.MustMatch(t, tc.ExpectedCode, status.Code(err), "wrong expected code")
			if tc.ExpectedCode == codes.OK {
				testutils.MustMatch(t, tc.ExpectedStatus, resp.Availabilities[0].Status, "bad service availability status")
			}
		})
	}
}

func TestGRPCServer_GetAvailableTimeWindows(t *testing.T) {
	marketID := time.Now().UnixNano()
	serviceRegionID := time.Now().UnixNano()
	serviceDate := time.Date(2023, time.October, 31, 0, 0, 0, 0, time.UTC)
	snapshotTime := time.Now()
	visitID := time.Now().UnixNano()
	twDuration := 4 * time.Hour
	openHoursTW := &logisticsdb.TimeWindow{
		Start: serviceDate,
		End:   serviceDate.Add(8 * time.Hour),
	}

	startTimestamp := serviceDate
	endTimestamp := serviceDate.Add(twDuration)
	var expectedTimeWindows []*logisticspb.TimeWindowAvailability
	var expectedRouteStops []*optimizerpb.VRPShiftTeamRouteStop
	for i := 0; true; i++ {
		id := int64(-1 * (i + 1))
		startTimestamp = serviceDate.Add(time.Duration(i) * time.Hour).UTC()
		endTimestamp = startTimestamp.Add(twDuration).UTC()
		arrivalTimestampSec := startTimestamp.Add(twDuration / 2).Unix()
		expectedRouteStops = append(expectedRouteStops, &optimizerpb.VRPShiftTeamRouteStop{
			Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
				Visit: &optimizerpb.VRPShiftTeamVisit{
					VisitId:             proto.Int64(id),
					ArrivalTimestampSec: &arrivalTimestampSec,
				},
			},
		})
		if endTimestamp.After(openHoursTW.End) {
			break
		}

		twStatus := logisticspb.TimeWindowAvailability_STATUS_AVAILABLE
		if id == int64(-1) {
			twStatus = logisticspb.TimeWindowAvailability_STATUS_RECOMMENDED
		}

		expectedTimeWindows = append(expectedTimeWindows, &logisticspb.TimeWindowAvailability{
			TimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&startTimestamp),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimestamp),
			},
			Status: twStatus,
		})
	}

	cfVisit := &logisticspb.CheckFeasibilityVisit{
		MarketId: proto.Int64(marketID),
		ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalDate{
			ArrivalDate: logisticsdb.TimeToProtoDate(&serviceDate),
		},
	}

	mockDB := &MockLogisticsDB{
		GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{
			ID: serviceRegionID,
		},
		GetServiceRegionVRPDataResult: &logisticsdb.ServiceRegionVRPData{
			ServiceRegionID: serviceRegionID,
			ServiceDate:     serviceDate,
			SnapshotTime:    snapshotTime,
			Settings:        &optimizersettings.Settings{},
			OpenHoursTW:     openHoursTW,
			CheckFeasibilityData: &logisticsdb.CheckFeasibilityVRPDataResult{
				Visits: []*logisticspb.CheckFeasibilityVisit{
					cfVisit,
				},
				LocIDs: []int64{1},
			},
		},
		CreateVRPProblemResult: &logisticsdb.VRPProblemData{
			VRPProblem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{
				Visits: []*optimizerpb.VRPVisit{{Id: proto.Int64(visitID)}},
			}},
		},
	}

	mockSolver := &MockVRPSolver{
		solution: &optimizerpb.VRPSolution{
			Description: &optimizerpb.VRPDescription{
				ShiftTeams: []*optimizerpb.VRPShiftTeam{
					{
						Route: &optimizerpb.VRPShiftTeamRoute{
							Stops: expectedRouteStops,
						},
					},
				},
				UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{},
				RestBreaks:       []*optimizerpb.VRPRestBreak{},
				Visits:           []*optimizerpb.VRPVisit{},
				Locations:        []*optimizerpb.VRPLocation{},
			},
			Score: &optimizerpb.VRPScore{
				HardScore: proto.Int64(0),
				IsValid:   proto.Bool(true),
			},
		},
	}

	baseRequest := &logisticspb.GetAvailableTimeWindowsRequest{
		CheckFeasibilityVisit: cfVisit,
		ServiceDates: []*commonpb.Date{
			logisticsdb.TimeToProtoDate(&serviceDate),
		},
	}

	limitStart := serviceDate.Add(1 * time.Hour)
	limitEnd := limitStart.Add(5 * time.Hour)
	limitTW := &commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&limitStart),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&limitEnd),
	}

	extraDate := serviceDate.AddDate(0, 0, 1)
	limitedRequest := &logisticspb.GetAvailableTimeWindowsRequest{
		CheckFeasibilityVisit: cfVisit,
		ServiceDates: []*commonpb.Date{
			logisticsdb.TimeToProtoDate(&serviceDate),
			logisticsdb.TimeToProtoDate(&extraDate),
		},
		MustBeSeenWithinTimeWindow: limitTW,
	}

	expectedLimitedTimeWindows := make([]*logisticspb.TimeWindowAvailability, 2)
	for i := 0; i < 2; i++ {
		startTimestamp = limitStart.Add(time.Duration(i) * time.Hour).UTC()
		endTimestamp = startTimestamp.Add(twDuration).UTC()
		availabilityStatus := logisticspb.TimeWindowAvailability_STATUS_AVAILABLE
		if i == 0 {
			availabilityStatus = logisticspb.TimeWindowAvailability_STATUS_RECOMMENDED
		}
		expectedLimitedTimeWindows[i] = &logisticspb.TimeWindowAvailability{
			TimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&startTimestamp),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimestamp),
			},
			Status: availabilityStatus,
		}
	}

	expectedLimitedResponse := &logisticspb.GetAvailableTimeWindowsResponse{
		ServiceDateAvailabilities: []*logisticspb.ServiceDateAvailability{
			{
				ServiceDate: logisticsdb.TimeToProtoDate(&serviceDate),
				TimeWindows: expectedLimitedTimeWindows,
			},
			{
				ServiceDate: logisticsdb.TimeToProtoDate(&extraDate),
			},
		},
	}

	badDateTime := &commonpb.DateTime{
		Year:    int32(limitStart.Year()),
		Month:   int32(limitStart.Month()),
		Day:     int32(limitStart.Day()),
		Hours:   int32(limitStart.Hour()),
		Minutes: int32(limitStart.Minute()),
		Seconds: int32(limitStart.Second()),
		Nanos:   int32(limitStart.Nanosecond()),
		TimeOffset: &commonpb.DateTime_TimeZone{
			TimeZone: &commonpb.TimeZone{
				Id: "foo",
			},
		},
	}

	tcs := []struct {
		Desc       string
		Req        *logisticspb.GetAvailableTimeWindowsRequest
		MockSolver *MockVRPSolver
		MockDB     *MockLogisticsDB

		ExpectedCode     codes.Code
		ExpectedResponse *logisticspb.GetAvailableTimeWindowsResponse
	}{
		{
			Desc:       "Base case",
			Req:        baseRequest,
			MockSolver: mockSolver,
			MockDB:     mockDB,

			ExpectedCode: codes.OK,
			ExpectedResponse: &logisticspb.GetAvailableTimeWindowsResponse{
				ServiceDateAvailabilities: []*logisticspb.ServiceDateAvailability{
					{
						ServiceDate: logisticsdb.TimeToProtoDate(&serviceDate),
						TimeWindows: expectedTimeWindows,
					},
				},
			},
		},
		{
			Desc:       "Base case - With Limit TW",
			Req:        limitedRequest,
			MockSolver: mockSolver,
			MockDB:     mockDB,

			ExpectedCode:     codes.OK,
			ExpectedResponse: expectedLimitedResponse,
		},
		{
			Desc: "Bad time zone in Limit TW Start",
			Req: &logisticspb.GetAvailableTimeWindowsRequest{
				CheckFeasibilityVisit: cfVisit,
				ServiceDates:          limitedRequest.ServiceDates,
				MustBeSeenWithinTimeWindow: &commonpb.TimeWindow{
					StartDatetime: badDateTime,
					EndDatetime:   logisticsdb.TimeToProtoDateTime(&limitEnd),
				},
			},
			MockSolver: mockSolver,
			MockDB:     mockDB,

			ExpectedCode:     codes.Internal,
			ExpectedResponse: expectedLimitedResponse,
		},
		{
			Desc: "Bad time zone in Limit TW End",
			Req: &logisticspb.GetAvailableTimeWindowsRequest{
				CheckFeasibilityVisit: cfVisit,
				ServiceDates:          limitedRequest.ServiceDates,
				MustBeSeenWithinTimeWindow: &commonpb.TimeWindow{
					StartDatetime: logisticsdb.TimeToProtoDateTime(&limitStart),
					EndDatetime:   badDateTime,
				},
			},
			MockSolver: mockSolver,
			MockDB:     mockDB,

			ExpectedCode:     codes.Internal,
			ExpectedResponse: expectedLimitedResponse,
		},
		{
			Desc:       "Nil vrpData.CheckFeasibilityData - No Availability",
			Req:        baseRequest,
			MockSolver: mockSolver,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDResult: mockDB.GetServiceRegionForStationMarketIDResult,
				GetServiceRegionVRPDataResult: &logisticsdb.ServiceRegionVRPData{
					ServiceRegionID: serviceRegionID,
					ServiceDate:     serviceDate,
					SnapshotTime:    snapshotTime,
					Settings:        &optimizersettings.Settings{},
					OpenHoursTW:     openHoursTW,
				},
			},

			ExpectedCode: codes.OK,
			ExpectedResponse: &logisticspb.GetAvailableTimeWindowsResponse{
				ServiceDateAvailabilities: []*logisticspb.ServiceDateAvailability{
					{
						ServiceDate: logisticsdb.TimeToProtoDate(&serviceDate),
					},
				},
			},
		},
		{
			Desc: "No CheckFeasibilityVisit - should err",
			Req: &logisticspb.GetAvailableTimeWindowsRequest{
				ServiceDates: []*commonpb.Date{
					logisticsdb.TimeToProtoDate(&serviceDate),
				},
			},
			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc: "No ServiceDates - should err",
			Req: &logisticspb.GetAvailableTimeWindowsRequest{
				CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
					MarketId: proto.Int64(marketID),
					ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalDate{
						ArrivalDate: logisticsdb.TimeToProtoDate(&serviceDate),
					},
				},
			},
			ExpectedCode: codes.InvalidArgument,
		},
		{
			Desc: "Service Region not found - should err",
			Req:  baseRequest,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDErr: errors.New("not found"),
			},
			ExpectedCode: codes.NotFound,
		},
		{
			Desc: "VRP Data err - should err",
			Req:  baseRequest,
			MockDB: &MockLogisticsDB{
				GetServiceRegionForStationMarketIDResult: mockDB.GetServiceRegionForStationMarketIDResult,
				GetServiceRegionVRPDataErr:               errors.New("lol err"),
			},
			ExpectedCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := &GRPCServer{
				LogisticsDB:     tc.MockDB,
				VRPSolver:       tc.MockSolver,
				SettingsService: mockSettingsService,
				Clock:           MockClock(serviceDate),
			}

			response, err := s.GetAvailableTimeWindows(
				context.Background(),
				tc.Req,
			)

			testutils.MustMatch(t, tc.ExpectedCode, status.Code(err), "wrong expected code")
			if tc.ExpectedCode == codes.OK {
				testutils.MustMatch(t, tc.ExpectedResponse, response)
			}
		})
	}
}
