package grpc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	dateTimeLayout              = time.RFC3339Nano
	searchPatientsMaxNumResults = int32(100)
	popHealthBackfillType       = "pophealth"
)

var (
	listsVisitsBackfillError                    = "listsVisits error: %v"
	careRequestPartnerAssociationsBackfillError = "backfillCareRequestPartnerAssociations error: %v"
	updatePartnerAssociationBackfillError       = "updatePartnerAssociationBackfillByID error: %v"
)

func (s *Server) StartBackfill(ctx context.Context, req *partnerpb.StartBackfillRequest) (*partnerpb.StartBackfillResponse, error) {
	if req.GetBackfillType() == partnerpb.BackfillType_BACKFILL_TYPE_UNSPECIFIED {
		return nil, status.Error(codes.InvalidArgument, "backfill type is required")
	}

	if req.StartDate == nil || req.EndDate == nil {
		return nil, status.Error(codes.InvalidArgument, "start date and end date are required")
	}

	startDateTime := time.Date(int(req.GetStartDate().GetYear()), time.Month(req.GetStartDate().GetMonth()), int(req.GetStartDate().GetDay()), 0, 0, 0, 0, time.UTC)
	endDateTime := time.Date(int(req.GetEndDate().GetYear()), time.Month(req.GetEndDate().GetMonth()), int(req.GetEndDate().GetDay()), 0, 0, 0, 0, time.UTC)
	if startDateTime.After(endDateTime) {
		return nil, status.Errorf(codes.InvalidArgument, "start date %s is after end date %s", startDateTime, endDateTime)
	}

	partner, err := s.DBService.GetPartnerByStationChannelItemID(ctx, req.GetPartnerId())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "partner with station channel item id %d not found", req.GetPartnerId())
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerByStationChannelItemID error: %v", err)
	}

	backfillInProgress, err := s.existsInProgressBackfill(ctx, partner.ID, req.GetBackfillType())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetInProgressBackfillByPartnerAndType error: %v", err)
	}

	if backfillInProgress {
		return nil, status.Errorf(codes.FailedPrecondition, "backfill is already in progress for partner %d and type %s", req.GetPartnerId(), req.GetBackfillType())
	}

	careRequestPartnerBackfill, err := s.DBService.AddPartnerAssociationBackfill(ctx, partnersql.AddPartnerAssociationBackfillParams{
		PartnerID:    partner.ID,
		StartDate:    startDateTime,
		EndDate:      endDateTime,
		BackfillType: partnerdb.BackfillTypeEnumToBackfillTypeSlug[req.GetBackfillType()],
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "AddPartnerAssociationBackfill error: %v", err)
	}

	go func() {
		err := s.processPopHealthBackfill(context.Background(), req.GetPartnerId(), careRequestPartnerBackfill)
		if err != nil {
			s.Logger.Errorw("processPopHealthBackfill error",
				"careRequestPartnerBackfillID", careRequestPartnerBackfill.ID,
				zap.Error(err),
			)
		}
	}()

	return &partnerpb.StartBackfillResponse{}, nil
}

func (s *Server) existsInProgressBackfill(ctx context.Context, partnerID int64, backfillType partnerpb.BackfillType) (bool, error) {
	_, err := s.DBService.GetInProgressBackfillByPartnerAndType(ctx, partnersql.GetInProgressBackfillByPartnerAndTypeParams{
		PartnerID:    partnerID,
		BackfillType: partnerdb.BackfillTypeEnumToBackfillTypeSlug[backfillType],
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *Server) ProcessPendingBackfills(ctx context.Context) error {
	pendingCareRequestPartnerBackfills, err := s.DBService.GetPendingBackfills(ctx)
	if err != nil {
		s.Logger.Errorw("GetPendingBackfills error", zap.Error(err))
		return err
	}

	if len(pendingCareRequestPartnerBackfills) == 0 {
		return nil
	}

	eg, egCtx := errgroup.WithContext(ctx)
	for _, careRequestPartnerBackfill := range pendingCareRequestPartnerBackfills {
		careRequestPartnerBackfill := careRequestPartnerBackfill
		backfillType := partnerdb.BackfillTypeIDToBackfillTypeSlug[careRequestPartnerBackfill.BackfillTypeID]
		partner, err := s.DBService.GetPartnerByID(ctx, careRequestPartnerBackfill.PartnerID)
		if err != nil {
			s.Logger.Errorw("GetPartnerByID error",
				"careRequestPartnerBackfillID", careRequestPartnerBackfill.ID,
				"partnerID", careRequestPartnerBackfill.PartnerID,
				zap.Error(err),
			)
			return err
		}

		if backfillType == popHealthBackfillType {
			eg.Go(func() error {
				return s.processPopHealthBackfill(egCtx, partner.StationChannelItemID, careRequestPartnerBackfill)
			})

			s.Logger.Infow("pending backfill started",
				"careRequestPartnerBackfillID", careRequestPartnerBackfill.ID,
				"partnerID", careRequestPartnerBackfill.PartnerID,
				"backfillType", backfillType,
			)
		}
	}
	err = eg.Wait()
	if err != nil {
		s.Logger.Errorw("ProcessPendingBackfills error", zap.Error(err))
		return err
	}

	return nil
}

func (s *Server) processPopHealthBackfill(ctx context.Context, stationChannelItemID int64, careRequestPartnerBackfill *partnersql.CareRequestPartnerBackfill) error {
	startDate := careRequestPartnerBackfill.StartDate
	for {
		if careRequestPartnerBackfill.LastProcessedCareRequestCreatedAt.Valid {
			startDate = careRequestPartnerBackfill.LastProcessedCareRequestCreatedAt.Time.UTC()
		}
		startDateTimeProto, _ := timeToDateTimeProto(startDate)
		endDateTimeProto, _ := timeToDateTimeProto(careRequestPartnerBackfill.EndDate)
		listVisitsResponse, err := s.EpisodeClient.ListVisits(ctx, &episodepb.ListVisitsRequest{
			CreatedAtTimeWindow: &common.TimeWindow{
				StartDatetime: startDateTimeProto,
				EndDatetime:   endDateTimeProto,
			},
			// We need to fetch one more than the batch size to obtain the start date of next batch
			MaxVisits:      s.BackfillBatchingParams.BatchSize + 1,
			IncludePatient: proto.Bool(true),
			SortOrder:      episodepb.ListVisitsRequest_SORT_ORDER_CREATED_AT.Enum(),
		})
		if err != nil {
			s.Logger.Errorw("ListVisits error",
				"careRequestPartnerBackfillID", careRequestPartnerBackfill.ID,
				"startDate", startDate,
				"endDate", careRequestPartnerBackfill.EndDate,
				zap.Error(err),
			)
			s.completeBackfill(
				ctx,
				stationChannelItemID,
				careRequestPartnerBackfill,
				pophealthpb.BackfillStatus_BACKFILL_STATUS_FAILED,
				sqltypes.ToValidNullString(fmt.Sprint(listsVisitsBackfillError, err)),
			)
			return err
		}

		if len(listVisitsResponse.GetCareRequests()) == 0 {
			s.completeBackfill(
				ctx,
				stationChannelItemID,
				careRequestPartnerBackfill,
				pophealthpb.BackfillStatus_BACKFILL_STATUS_PROCESSED,
				sql.NullString{},
			)
			return nil
		}

		var careRequests []*common.CareRequestInfo
		if len(listVisitsResponse.GetCareRequests()) <= int(s.BackfillBatchingParams.BatchSize) {
			careRequests = listVisitsResponse.GetCareRequests()
		} else {
			careRequests = listVisitsResponse.GetCareRequests()[:len(listVisitsResponse.GetCareRequests())-1]
		}
		nextBatchCareRequest := listVisitsResponse.GetCareRequests()[len(listVisitsResponse.GetCareRequests())-1]
		nextBatchStartDateUTC := time.Unix(nextBatchCareRequest.GetCreatedAtTimestampSec(), 0).UTC()

		var batchNumberOfMatches int32
		for _, careRequest := range careRequests {
			if err := validateCareRequestAttributes(careRequest); err != nil {
				s.Logger.Debugw("validateCareRequestAttributes error",
					"careRequestID", careRequest.Id,
					zap.Error(err),
				)
				continue
			}

			searchPatientResponse, err := s.PopHealthSearchPatientClient.SearchPatient(ctx, &pophealthpb.SearchPatientRequest{
				FirstName:      careRequest.Patient.Name.GetGivenName(),
				LastName:       careRequest.Patient.Name.GetFamilyName(),
				DateOfBirth:    careRequest.Patient.GetDateOfBirth(),
				Ssn:            careRequest.Patient.SocialSecurityNumber,
				ChannelItemIds: []int64{stationChannelItemID},
				MaxNumResults:  proto.Int32(searchPatientsMaxNumResults),
				IsBackfill:     true,
			})
			if err != nil {
				s.Logger.Errorw("SearchPatient error",
					"careRequestID", careRequest.Id,
					"firstName", careRequest.Patient.Name.GetGivenName(),
					"lastName", careRequest.Patient.Name.GetFamilyName(),
					"dateOfBirth", careRequest.Patient.GetDateOfBirth(),
					zap.Error(err),
				)
				continue
			}

			numberOfMatches, err := s.backfillCareRequestPartnerAssociations(ctx, careRequest.Id, searchPatientResponse.GetPatient())
			if err != nil {
				s.Logger.Errorw("backfillCareRequestPartnerAssociations error",
					"careRequestID", careRequest.Id,
					zap.Error(err),
				)
				s.completeBackfill(
					ctx,
					stationChannelItemID,
					careRequestPartnerBackfill,
					pophealthpb.BackfillStatus_BACKFILL_STATUS_FAILED,
					sqltypes.ToValidNullString(fmt.Sprint(careRequestPartnerAssociationsBackfillError, err)),
				)
				return err
			}

			batchNumberOfMatches += numberOfMatches
		}

		careRequestPartnerBackfill, err = s.DBService.UpdatePartnerAssociationBackfillByID(
			ctx,
			partnersql.UpdatePartnerAssociationBackfillByIDParams{
				ID:                                careRequestPartnerBackfill.ID,
				LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(nextBatchStartDateUTC),
				NumberOfNewMatches:                batchNumberOfMatches,
			},
		)
		if err != nil {
			s.Logger.Errorw("UpdatePartnerAssociationBackfillByID error",
				"careRequestPartnerBackfillID", careRequestPartnerBackfill.ID,
				zap.Error(err),
			)
			s.completeBackfill(
				ctx,
				stationChannelItemID,
				careRequestPartnerBackfill,
				pophealthpb.BackfillStatus_BACKFILL_STATUS_FAILED,
				sqltypes.ToValidNullString(fmt.Sprint(updatePartnerAssociationBackfillError, err)),
			)
			return err
		}

		if len(careRequests) < int(s.BackfillBatchingParams.BatchSize) || careRequests[len(careRequests)-1].Id == nextBatchCareRequest.Id {
			s.completeBackfill(
				ctx,
				stationChannelItemID,
				careRequestPartnerBackfill,
				pophealthpb.BackfillStatus_BACKFILL_STATUS_PROCESSED,
				sql.NullString{},
			)
			return nil
		}

		time.Sleep(s.BackfillBatchingParams.SleepTimeBetweenBatches)
	}
}

func (s *Server) backfillCareRequestPartnerAssociations(
	ctx context.Context,
	careRequestID int64,
	patients []*pophealthpb.Patient,
) (int32, error) {
	careRequestPartners, err := s.DBService.GetCareRequestPartnersByStationCareRequestID(ctx, careRequestID)
	if err != nil {
		return 0, fmt.Errorf("GetCareRequestPartnersByStationCareRequestID error: %w", err)
	}

	popHealthPartnerMap, err := s.getPartnersMapFromPophealthPatients(ctx, patients)
	if err != nil {
		return 0, err
	}

	updatedCareRequestPartners, err := s.updateCareRequestPartnerAssociations(
		ctx,
		careRequestID,
		careRequestPartners,
		popHealthPartnerMap,
		popHealthSlug,
	)
	if err != nil {
		return 0, err
	}

	return int32(len(updatedCareRequestPartners)), nil
}

func (s *Server) completeBackfill(
	ctx context.Context,
	stationChannelItemID int64,
	careRequestPartnerBackfill *partnersql.CareRequestPartnerBackfill,
	status pophealthpb.BackfillStatus,
	errorDescription sql.NullString,
) {
	_, err := s.DBService.CompletePartnerAssociationBackfillByID(ctx, partnersql.CompletePartnerAssociationBackfillByIDParams{
		ID:               careRequestPartnerBackfill.ID,
		ErrorDescription: errorDescription,
	})
	if err != nil {
		s.Logger.Errorw("CompletePartnerAssociationBackfillByID error",
			"id", careRequestPartnerBackfill.ID,
			zap.Error(err),
		)
	}
	_, err = s.PopHealthBackfillClient.UpdateBackfillFileStatus(ctx, &pophealthpb.UpdateBackfillFileStatusRequest{
		ChannelItemId:   stationChannelItemID,
		NumberOfMatches: careRequestPartnerBackfill.NumberOfMatches,
		Status:          status,
	})
	if err != nil {
		s.Logger.Errorw("UpdateBackfillFileStatus error",
			"channelItemId", careRequestPartnerBackfill.PartnerID,
			"numberOfMatches", careRequestPartnerBackfill.NumberOfMatches,
			"status", status,
			zap.Error(err),
		)
	}
}

func validateCareRequestAttributes(careRequest *common.CareRequestInfo) error {
	switch {
	case careRequest.CreatedAtTimestampSec == nil:
		return errors.New("care request created_at_timestamp_sec is nil")
	case careRequest.Patient == nil:
		return errors.New("care request patient is nil")
	case careRequest.Patient.Name == nil:
		return errors.New("care request patient name is nil")
	case careRequest.Patient.DateOfBirth == nil:
		return errors.New("care request patient date_of_birth is nil")
	case careRequest.Patient.Name.GetGivenName() == "" || careRequest.Patient.Name.GetFamilyName() == "":
		return errors.New("care request patient given name or family name is empty")
	default:
		return nil
	}
}

func timeToDateTimeProto(date time.Time) (*common.DateTime, error) {
	dateString := date.Format(dateTimeLayout)
	return protoconv.DateTimeProto(&dateString, dateTimeLayout)
}
