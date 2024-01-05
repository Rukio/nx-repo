//go:build db_test

package main

import (
	"errors"
	"strconv"
	"testing"
	"time"

	visitvaluepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/visit_value"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestGetVisitValue(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	tcs := []struct {
		name string

		found bool

		wantErr error
	}{
		{
			name:  "visit value found",
			found: true,
		},
		{
			name:  "visit value not found",
			found: false,

			wantErr: status.Error(codes.NotFound, ErrVisitValueNotFound.Error()),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := visitValueGRPCServer(db)

			serviceLineName := "service-line-" + strconv.Itoa(int(time.Now().UnixNano()))
			payerName := "payer-" + strconv.Itoa(int(time.Now().UnixNano()))

			createdBefore := time.Now()
			if tc.found {
				visitValue, err := db.queries.TestAddVisitValue(ctx, caremanagerdb.TestAddVisitValueParams{
					ValueCents:           123,
					PayerName:            payerName,
					ServiceLineName:      serviceLineName,
					ServiceLineShortName: sqltypes.ToValidNullString(serviceLineName),
				})
				if err != nil {
					t.Fatal(err)
				}

				createdBefore = visitValue.CreatedAt
			}

			wantVisitValue, err := db.queries.GetLatestVisitValue(ctx, caremanagerdb.GetLatestVisitValueParams{
				PayerName:            payerName,
				ServiceLineShortName: sqltypes.ToValidNullString(serviceLineName),
				CreatedBefore:        createdBefore,
			})
			if err != nil {
				t.Fatal(err)
			}

			got, err := grpcServer.GetVisitValue(ctx, &visitvaluepb.GetVisitValueRequest{
				ServiceLineShortName: &serviceLineName,
				PayerName:            &payerName,
			})

			testutils.MustMatch(t, tc.wantErr, err)

			if err != nil {
				return
			}

			testutils.MustMatch(t, wantVisitValue[0].ValueCents, got.CompletionValueCents)
		})
	}
}

func Test_validateGetVisitValueRequest(t *testing.T) {
	tcs := []struct {
		name    string
		request *visitvaluepb.GetVisitValueRequest

		want error
	}{
		{
			name: "valid combination",
			request: &visitvaluepb.GetVisitValueRequest{
				PayerName:            proto.String("payer"),
				ServiceLineShortName: proto.String("service line"),
			},
		},
		{
			name: "nil payer",
			request: &visitvaluepb.GetVisitValueRequest{
				PayerName:            nil,
				ServiceLineShortName: proto.String("service line"),
			},

			want: errors.New("payer name is required"),
		},
		{
			name: "nil service line",
			request: &visitvaluepb.GetVisitValueRequest{
				PayerName:            proto.String("payer"),
				ServiceLineShortName: nil,
			},

			want: errors.New("service line short name is required"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			err := validateGetVisitValueRequest(tc.request)
			testutils.MustMatch(t, tc.want, err)
		})
	}
}

func visitValueGRPCServer(db *CaremanagerDB) *VisitValueGRPCServer {
	return &VisitValueGRPCServer{
		CaremanagerDB: db,
	}
}
