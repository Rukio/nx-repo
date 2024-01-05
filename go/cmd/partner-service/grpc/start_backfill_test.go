package grpc

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestStartBackfill(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	startDate := &common.Date{
		Year:  2023,
		Month: 1,
		Day:   1,
	}
	endDate := &common.Date{
		Year:  2023,
		Month: 1,
		Day:   31,
	}
	startDateTime := time.Date(int(startDate.Year), time.Month(startDate.Month), int(startDate.Day), 0, 0, 0, 0, time.UTC)
	endDateTime := time.Date(int(endDate.Year), time.Month(endDate.Month), int(endDate.Day), 0, 0, 0, 0, time.UTC)
	validRequest := &partnerpb.StartBackfillRequest{
		PartnerId:    baseID,
		BackfillType: partnerpb.BackfillType_BACKFILL_TYPE_POPHEALTH,
		StartDate:    startDate,
		EndDate:      endDate,
	}
	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.StartBackfillRequest

		wantErr      error
		wantResponse *partnerpb.StartBackfillResponse
	}{
		{
			name: "valid request returns response",
			server: &Server{
				DBService: &mockDBService{
					getInProgressBackfillByPartnerAndTypeErr: pgx.ErrNoRows,
				},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{},
						},
					},
				},
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				Logger:                  logger,
			},
			request: validRequest,

			wantResponse: &partnerpb.StartBackfillResponse{},
		},
		{
			name: "invalid request missing backfill type",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.StartBackfillRequest{
				PartnerId: baseID + 1,
				StartDate: startDate,
				EndDate:   endDate,
			},

			wantErr: status.Error(codes.InvalidArgument, "backfill type is required"),
		},
		{
			name: "invalid request missing start date",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.StartBackfillRequest{
				PartnerId:    baseID + 2,
				BackfillType: partnerpb.BackfillType_BACKFILL_TYPE_POPHEALTH,
				EndDate:      endDate,
			},

			wantErr: status.Error(codes.InvalidArgument, "start date and end date are required"),
		},
		{
			name: "invalid request start date after end date",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.StartBackfillRequest{
				PartnerId:    baseID + 2,
				BackfillType: partnerpb.BackfillType_BACKFILL_TYPE_POPHEALTH,
				StartDate:    endDate,
				EndDate:      startDate,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "start date %s is after end date %s", endDateTime, startDateTime),
		},
		{
			name: "invalid request partner with station channel item id not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
				},
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "partner with station channel item id %d not found", validRequest.PartnerId),
		},
		{
			name: "valid request fails when db service fails to get partner by station channel item id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrTxClosed,
				},
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerByStationChannelItemID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "valid request fails if backfill is already in progress",
			server: &Server{
				DBService: &mockDBService{
					getInProgressBackfillByPartnerAndTypeResp: partnersql.CareRequestPartnerBackfill{},
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.FailedPrecondition, "backfill is already in progress for partner %d and type %s", validRequest.PartnerId, validRequest.BackfillType),
		},
		{
			name: "valid request fails when db service fails to get in progress backfill",
			server: &Server{
				DBService: &mockDBService{
					getInProgressBackfillByPartnerAndTypeErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetInProgressBackfillByPartnerAndType error: %v", pgx.ErrTxClosed),
		},
		{
			name: "valid request fails when db service fails to create backfill",
			server: &Server{
				DBService: &mockDBService{
					getInProgressBackfillByPartnerAndTypeErr: pgx.ErrNoRows,
					addPartnerAssociationBackfillErr:         pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "AddPartnerAssociationBackfill error: %v", pgx.ErrTxClosed),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.StartBackfill(ctx, test.request)

			testutils.MustMatch(t, test.wantErr, err)
			testutils.MustMatch(t, test.wantResponse, response)
		})
	}
}

func TestProcessPopHealthBackfill(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID
	careRequestPartnerBackfill := &partnersql.CareRequestPartnerBackfill{
		ID:             baseID,
		PartnerID:      baseID + 1,
		BackfillTypeID: 1,
		StartDate:      time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:        time.Date(2023, 1, 3, 0, 0, 0, 0, time.UTC),
	}
	popHealthSearchPatientClient := &mockPopHealthSearchPatientClient{
		response: &pophealthpb.SearchPatientResponse{
			Patient: []*pophealthpb.Patient{
				{
					Id:            strconv.Itoa(int(baseID)),
					ChannelItemId: baseID + 1,
				},
			},
		},
	}
	patient1 := &common.Patient{
		Id: proto.String(strconv.Itoa(int(baseID))),
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
		},
		DateOfBirth: &common.Date{
			Year:  1990,
			Month: 2,
			Day:   12,
		},
	}
	patient2 := &common.Patient{
		Id: proto.String(strconv.Itoa(int(baseID) + 1)),
		Name: &common.Name{
			GivenName:  proto.String("Luis"),
			FamilyName: proto.String("Peterson"),
		},
		DateOfBirth: &common.Date{
			Year:  1992,
			Month: 4,
			Day:   20,
		},
	}
	patient3 := &common.Patient{
		Id: proto.String(strconv.Itoa(int(baseID) + 2)),
		Name: &common.Name{
			GivenName:  proto.String("Pedro"),
			FamilyName: proto.String("Lopez"),
		},
		DateOfBirth: &common.Date{
			Year:  1995,
			Month: 7,
			Day:   19,
		},
	}
	tests := []struct {
		name   string
		server *Server

		wantErr error
	}{
		{
			name: "successful backfill with zero care requests fetched from ListVisits",
			server: &Server{
				DBService:               &mockDBService{},
				Logger:                  logger,
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{CareRequests: []*common.CareRequestInfo{}},
					},
				},
			},
		},
		{
			name: "successful backfill with two batches of care requests fetched from ListVisits",
			server: &Server{
				DBService: &mockDBService{
					updatePartnerAssociationBackfillByIDResp: partnersql.CareRequestPartnerBackfill{
						ID:                                baseID,
						PartnerID:                         baseID + 1,
						BackfillTypeID:                    1,
						StartDate:                         time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
						EndDate:                           time.Date(2023, 1, 3, 0, 0, 0, 0, time.UTC),
						LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(time.Date(2023, 1, 2, 8, 12, 23, 0, time.UTC)),
					},
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 2,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672647143),
								},
							},
						},
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID + 1,
									Patient:               patient2,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
								{
									Id:                    baseID + 2,
									Patient:               patient3,
									CreatedAtTimestampSec: proto.Int64(1672640861),
								},
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672647143),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 2,
				},
			},
		},
		{
			name: "failed backfill with error from ListVisits",
			server: &Server{
				DBService:               &mockDBService{},
				Logger:                  logger,
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					listVisitsErr: errors.New("failed to fetch care requests"),
				},
			},

			wantErr: errors.New("failed to fetch care requests"),
		},
		{
			name: "successful backfill with invalid care requests fetched from ListVisits",
			server: &Server{
				DBService:                    &mockDBService{},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:      baseID,
									Patient: patient1,
								},
								{
									Id:                    baseID + 1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
								{
									Id: baseID + 2,
									Patient: &common.Patient{
										Id: proto.String(strconv.Itoa(int(baseID) + 1)),
										DateOfBirth: &common.Date{
											Year:  1995,
											Month: 7,
											Day:   19,
										},
									},
									CreatedAtTimestampSec: proto.Int64(1672640861),
								},
								{
									Id: baseID + 3,
									Patient: &common.Patient{
										Id: proto.String(strconv.Itoa(int(baseID) + 2)),
										Name: &common.Name{
											GivenName:  proto.String("Luis"),
											FamilyName: proto.String("Perez"),
										},
									},
									CreatedAtTimestampSec: proto.Int64(1672650861),
								},
								{
									Id: baseID + 4,
									Patient: &common.Patient{
										Id: proto.String(strconv.Itoa(int(baseID) + 2)),
										Name: &common.Name{
											GivenName:  proto.String(""),
											FamilyName: proto.String(""),
										},
										DateOfBirth: &common.Date{
											Year:  1995,
											Month: 7,
											Day:   19,
										},
									},
									CreatedAtTimestampSec: proto.Int64(1672650861),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},
		},
		{
			name: "successful backfill with error in search patient call",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					err: errors.New("failed to search patient"),
				},
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
								{
									Id:                    baseID + 1,
									Patient:               patient2,
									CreatedAtTimestampSec: proto.Int64(1672650861),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},
		},
		{
			name: "failed backfill with error getting care request partners",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDErr: pgx.ErrTxClosed,
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},

			wantErr: fmt.Errorf("GetCareRequestPartnersByStationCareRequestID error: %w", pgx.ErrTxClosed),
		},
		{
			name: "failed backfill with error getting partners by channel item id list",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByStationChannelItemIDListErr: pgx.ErrTxClosed,
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},

			wantErr: fmt.Errorf("GetPartnersByStationChannelItemIDList error: %w", pgx.ErrTxClosed),
		},
		{
			name: "failed backfill with error adding care request partner",
			server: &Server{
				DBService: &mockDBService{
					addCareRequestPartnerErr: pgx.ErrTxClosed,
					getPartnersByStationChannelItemIDListResp: []*partnersql.Partner{
						{
							ID:                   baseID,
							StationChannelItemID: baseID + 1,
						},
					},
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},

			wantErr: fmt.Errorf("AddCareRequestPartner error: %w", pgx.ErrTxClosed),
		},
		{
			name: "failed backfill with error updating partner association backfill",
			server: &Server{
				DBService: &mockDBService{
					updatePartnerAssociationBackfillByIDErr: pgx.ErrTxClosed,
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},

			wantErr: pgx.ErrTxClosed,
		},
		{
			name: "failed backfill with error completing partner association backfill",
			server: &Server{
				DBService: &mockDBService{
					completePartnerAssociationBackfillByIDErr: pgx.ErrTxClosed,
				},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient:      &mockPopHealthBackfillClient{},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},
		},
		{
			name: "failed backfill with error updating backfill file status",
			server: &Server{
				DBService:                    &mockDBService{},
				Logger:                       logger,
				PopHealthSearchPatientClient: popHealthSearchPatientClient,
				PopHealthBackfillClient: &mockPopHealthBackfillClient{
					updateBackfillFileStatusErr: errors.New("error updating backfill file status"),
				},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{
								{
									Id:                    baseID,
									Patient:               patient1,
									CreatedAtTimestampSec: proto.Int64(1672531200),
								},
							},
						},
					},
				},
				BackfillBatchingParams: BackfillBatchingParams{
					BatchSize: 4,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.server.processPopHealthBackfill(ctx, stationChannelItemID, careRequestPartnerBackfill)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

func TestProcessPendingBackfills(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	startDate := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2020, 1, 2, 0, 0, 0, 0, time.UTC)
	careRequestPartnerBackfills := []*partnersql.CareRequestPartnerBackfill{
		{
			ID:                                baseID,
			PartnerID:                         baseID,
			BackfillTypeID:                    1,
			StartDate:                         startDate,
			EndDate:                           endDate,
			LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(startDate.Add(1 * time.Hour)),
		},
		{
			ID:                                baseID + 1,
			PartnerID:                         baseID + 1,
			BackfillTypeID:                    1,
			StartDate:                         startDate,
			EndDate:                           endDate,
			LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(startDate.Add(5 * time.Hour)),
		},
	}
	partner := partnersql.GetPartnerByIDRow{
		ID:                   baseID,
		StationChannelItemID: baseID + 1,
	}
	tests := []struct {
		name   string
		server *Server

		wantErr error
	}{
		{
			name: "successfully process pending backfills",
			server: &Server{
				DBService: &mockDBService{
					getPendingBackfillsResp: careRequestPartnerBackfills,
					getPartnerByIDResp:      partner,
				},
				EpisodeClient: &mockEpisodeClient{
					numberOfListVisitsCalls: 1,
					listVisitsResp: []*episodepb.ListVisitsResponse{
						{
							CareRequests: []*common.CareRequestInfo{},
						},
					},
				},
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				Logger:                  logger,
			},
		},
		{
			name: "failed to get pending backfills by type",
			server: &Server{
				DBService: &mockDBService{
					getPendingBackfillsErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},

			wantErr: pgx.ErrTxClosed,
		},
		{
			name: "no pending backfills found",
			server: &Server{
				DBService: &mockDBService{
					getPendingBackfillsResp: []*partnersql.CareRequestPartnerBackfill{},
				},
				Logger: logger,
			},
		},
		{
			name: "failed to get partner by id",
			server: &Server{
				DBService: &mockDBService{
					getPendingBackfillsResp: careRequestPartnerBackfills[:1],
					getPartnerByIDErr:       pgx.ErrTxClosed,
				},
				Logger: logger,
			},

			wantErr: pgx.ErrTxClosed,
		},
		{
			name: "failed to process pending backfill",
			server: &Server{
				DBService: &mockDBService{
					getPendingBackfillsResp: careRequestPartnerBackfills[:1],
					getPartnerByIDResp:      partner,
				},
				EpisodeClient: &mockEpisodeClient{
					listVisitsErr: errors.New("error listing visits"),
				},
				PopHealthBackfillClient: &mockPopHealthBackfillClient{},
				Logger:                  logger,
			},

			wantErr: errors.New("error listing visits"),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.server.ProcessPendingBackfills(ctx)

			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}
