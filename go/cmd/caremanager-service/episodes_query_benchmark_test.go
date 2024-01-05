//go:build db_test

package main

import (
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
)

func BenchmarkGetEpisodes(b *testing.B) {
	ctx, pool, done := setupDBTest(b)
	defer done()

	db := NewCaremanagerDB(pool)
	taskType, _ := getDefaultTaskType(ctx, db)

	// TODO: Need bulk insert queries for Episodes to test bigger cases
	testCases := []struct {
		episodes        int
		tasksPerEpisode int
	}{
		{10, 10},
		{100, 20},
		{1000, 30},
		{10000, 50},
	}

	for _, testCase := range testCases {
		b.Run(fmt.Sprintf("%d-episodes-%d-task-per-episode", testCase.episodes, testCase.tasksPerEpisode), func(b *testing.B) {
			market := getMockedMarket(time.Now().UnixNano())
			if testCase.episodes == 10000 {
				fmt.Println(market.Id)
			}
			for i := 0; i < testCase.episodes; i++ {
				createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
					customMarket: market,
				})
				if err != nil {
					b.Fatal(err.Error())
				}
				var (
					descriptions      []string
					areTasksCompleted []bool
					episodeIds        []int64
					taskTypeIds       []int64
				)
				for j := 0; j < testCase.tasksPerEpisode; j++ {
					descriptions = append(descriptions, "test description")
					areTasksCompleted = append(areTasksCompleted, j%2 == 0)
					episodeIds = append(episodeIds, createTestEpisodeResult.episode.ID)
					taskTypeIds = append(taskTypeIds, taskType.ID)
				}
				_, _ = db.queries.CreateTasks(ctx, caremanager.CreateTasksParams{
					Descriptions:      descriptions,
					AreTasksCompleted: areTasksCompleted,
					EpisodeIds:        episodeIds,
					TaskTypeIds:       taskTypeIds,
				})
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := db.queries.GetEpisodes(ctx, caremanager.GetEpisodesParams{
					MarketIds:       []int64{market.Id},
					IncompleteTasks: true,
					PageSize:        1000,
					PageOffset:      0,
					PatientName:     sql.NullString{String: "some", Valid: true},
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
