//go:build db_test

package tasks_test

import (
	"context"
	"fmt"
	"strconv"
	"testing"
	"time"

	caremanagersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	testDBName                    = "caremanager"
	carePhaseDailyAndOnboardingID = 6
	serviceLineAdvancedCareID     = 1
)

func setupTestDB(t testutils.GetDBConnPooler) (context.Context, *caremanagersql.Queries, func()) {
	pool := testutils.GetDBConnPool(t, testDBName)
	db := caremanagersql.New(pool)

	return context.Background(), db, func() {
		pool.Close()
	}
}

func BenchmarkGetActivePatients(b *testing.B) {
	ctx, db, done := setupTestDB(b)
	defer done()

	tcs := []struct {
		patients int
	}{
		{100},
		{1000},
		{10000},
	}

	for _, tc := range tcs {
		collectedAthenaIDs := make([]string, tc.patients)
		createdEpisodes := 0
		for i := 0; i < tc.patients; i++ {
			collectedAthenaIDs[i] = strconv.Itoa(time.Now().Nanosecond())
			patient, err := db.CreatePatient(ctx, caremanagersql.CreatePatientParams{
				FirstName:                 "Benchmark",
				LastName:                  "Test",
				Sex:                       "Male",
				PhoneNumber:               "123",
				AthenaMedicalRecordNumber: sqltypes.ToValidNullString(collectedAthenaIDs[i]),
			})
			if err != nil {
				b.Fatal(err.Error())
			}

			_, err = db.CreateEpisode(ctx, caremanagersql.CreateEpisodeParams{
				PatientID:     patient.ID,
				CarePhaseID:   carePhaseDailyAndOnboardingID,
				ServiceLineID: serviceLineAdvancedCareID,
			})
			if err != nil {
				b.Fatal(err.Error())
			}
			createdEpisodes++
		}

		b.Run(fmt.Sprintf("%d", tc.patients), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_, err := db.GetActivePatients(ctx, caremanagersql.GetActivePatientsParams{
					AthenaIds: collectedAthenaIDs,
					PageSize:  25,
				})
				if err != nil {
					b.Fatal(err.Error())
				}
			}
		})
	}
}
