//go:build db_test

package notes_test

import (
	"context"
	"fmt"
	"testing"

	caremanagersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
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

func createEpisodeWithNotes(ctx context.Context, db *caremanagersql.Queries, notesCount int, patient *caremanagersql.Patient) (*caremanagersql.Episode, error) {
	episode, err := db.CreateEpisode(ctx, caremanagersql.CreateEpisodeParams{
		PatientID:     patient.ID,
		CarePhaseID:   1,
		ServiceLineID: 1,
	})
	if err != nil {
		return nil, err
	}

	for i := 0; i < notesCount; i++ {
		note, err := db.CreateNote(ctx, caremanagersql.CreateNoteParams{
			EpisodeID: sqltypes.ToValidNullInt64(episode.ID),
			Body:      fmt.Sprintf("note-benchmark-%d", i),
		})
		if err != nil {
			return nil, err
		}

		if i%2 == 0 {
			_, err := db.PinNote(ctx, note.ID)
			if err != nil {
				return nil, err
			}
		}

		if i%3 == 0 {
			_, err := db.DeleteNote(ctx, note.ID)
			if err != nil {
				return nil, err
			}
		}
	}

	return episode, nil
}

func BenchmarkGetEpisodeNotesSortedByRelevance(b *testing.B) {
	ctx, db, done := setupTestDB(b)
	defer done()

	testCases := []struct {
		episodes int
		notes    int
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
		var lastEpisodeID int64
		for i := 0; i < testCase.episodes; i++ {
			episode, err := createEpisodeWithNotes(ctx, db, testCase.notes, patient)
			if err != nil {
				b.Fatal(err.Error())
			}

			lastEpisodeID = episode.ID
		}

		b.Run(fmt.Sprintf("%dx%d", testCase.episodes, testCase.notes), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_, err := db.GetEpisodeNotesSortedByRelevance(ctx, lastEpisodeID)
				if err != nil {
					b.Fatal(err.Error())
				}
			}
		})
	}
}

func BenchmarkGetMostRelevantNotePerEpisodeID(b *testing.B) {
	ctx, db, done := setupTestDB(b)
	defer done()

	testCases := []struct {
		episodes int
		notes    int
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
		episodeIDs := []int64{}
		for i := 0; i < testCase.episodes; i++ {
			episode, err := createEpisodeWithNotes(ctx, db, testCase.notes, patient)
			if err != nil {
				b.Fatal(err.Error())
			}

			episodeIDs = append(episodeIDs, episode.ID)
		}

		b.Run(fmt.Sprintf("%dx%d", testCase.episodes, testCase.notes), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				_, err := db.GetMostRelevantNotePerEpisodeID(ctx, episodeIDs)
				if err != nil {
					b.Fatal(err.Error())
				}
			}
		})
	}
}
