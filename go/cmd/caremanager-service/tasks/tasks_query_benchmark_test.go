//go:build db_test

package tasks_test

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	caremanagersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	testDBName = "caremanager"
)

func setupTestDB(t testutils.GetDBConnPooler) (context.Context, *caremanagersql.Queries, func()) {
	pool := testutils.GetDBConnPool(t, testDBName)
	db := caremanagersql.New(pool)

	return context.Background(), db, func() {
		pool.Close()
	}
}

func createEpisodeWithTasks(ctx context.Context, db *caremanagersql.Queries, tasksCount int, patient *caremanagersql.Patient) (*caremanagersql.Episode, error) {
	episode, err := db.CreateEpisode(ctx, caremanagersql.CreateEpisodeParams{
		PatientID:     patient.ID,
		CarePhaseID:   1,
		ServiceLineID: 1,
	})
	if err != nil {
		return nil, err
	}

	params := caremanagersql.CreateTasksParams{}
	for i := 0; i < tasksCount; i++ {
		params.EpisodeIds = append(params.EpisodeIds, episode.ID)
		params.Descriptions = append(params.Descriptions, "check pulse")
		params.AreTasksCompleted = append(params.AreTasksCompleted, false)
		params.TaskTypeIds = append(params.TaskTypeIds, 4)
	}
	_, err = db.CreateTasks(ctx, params)
	if err != nil {
		return nil, err
	}

	return episode, nil
}

func BenchmarkGetTasksByEpisodeID(b *testing.B) {
	ctx, db, done := setupTestDB(b)
	defer done()

	testCases := []struct {
		episodes int
		tasks    int
	}{
		{10, 30},
		{100, 30},
		{1000, 30},
		{10000, 30},
	}

	patient, err := db.CreatePatient(ctx, caremanagersql.CreatePatientParams{})
	if err != nil {
		b.Fatal(err.Error())
	}

	for _, testCase := range testCases {
		episodeIds := []int64{}
		for i := 0; i < testCase.episodes; i++ {
			episode, err := createEpisodeWithTasks(ctx, db, testCase.tasks, patient)
			if err != nil {
				b.Fatal(err.Error())
			}

			episodeIds = append(episodeIds, episode.ID)
		}

		b.Run(fmt.Sprintf("%dx%d", testCase.episodes, testCase.tasks), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_, err := db.GetTasksByEpisodeID(ctx, caremanagersql.GetTasksByEpisodeIDParams{
					Ids:               episodeIds,
					AreTasksCompleted: sql.NullBool{Bool: false, Valid: true},
				})
				if err != nil {
					b.Fatal(err.Error())
				}
			}
		})
	}
}
