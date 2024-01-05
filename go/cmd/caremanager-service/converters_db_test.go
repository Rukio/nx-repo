//go:build db_test

package main

import (
	"database/sql"
	"testing"
	"time"

	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestTaskProtoFromTaskSQL(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	taskTypes, err := db.queries.GetAllTaskTypes(ctx)
	if err != nil {
		t.Fatal("Could not get task types catalog")
	}
	taskType := taskTypes[0]

	createdAt := time.Now()
	updatedAt := time.Now()

	testCases := []struct {
		Name     string
		Input    *caremanagerdb.Task
		TaskType *caremanagerdb.TaskType

		ExpectedOutput   *caremanagerpb.Task
		ExpectedErrorMsg string
	}{
		{
			Name: "works",
			Input: &caremanagerdb.Task{
				Description:       "the best task",
				IsCompleted:       true,
				EpisodeID:         12,
				TaskTypeID:        taskType.ID,
				CompletedByUserID: sql.NullInt64{Valid: true, Int64: 1},
				CreatedAt:         createdAt,
				UpdatedAt:         updatedAt,
			},

			ExpectedOutput: &caremanagerpb.Task{
				Task:              "the best task",
				TaskType:          taskType.Slug,
				Status:            legacyTaskStatusCompleted,
				TaskableId:        12,
				CompletedByUserId: proto.Int64(1),
				CreatedAt:         proto.String(createdAt.Format(timestampLayout)),
				UpdatedAt:         proto.String(updatedAt.Format(timestampLayout)),
			},
		},
		{
			Name: "works for setting pending status",
			Input: &caremanagerdb.Task{
				Description: "the best task",
				IsCompleted: false,
				EpisodeID:   12,
				TaskTypeID:  taskType.ID,
				CreatedAt:   createdAt,
				UpdatedAt:   updatedAt,
			},

			ExpectedOutput: &caremanagerpb.Task{
				Task:       "the best task",
				TaskType:   taskType.Slug,
				Status:     legacyTaskStatusPending,
				TaskableId: 12,
				CreatedAt:  proto.String(createdAt.Format(timestampLayout)),
				UpdatedAt:  proto.String(updatedAt.Format(timestampLayout)),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			var tt *caremanagerdb.TaskType
			if testCase.TaskType != nil {
				tt = testCase.TaskType
			} else {
				tt, err = db.queries.GetTaskType(ctx, testCase.Input.TaskTypeID)
				if err != nil {
					t.Fatal(err.Error())
				}
			}

			output := TaskProtoFromTaskSQL(testCase.Input, tt)

			testutils.MustMatch(t, testCase.ExpectedOutput, output, "TaskProtoFromTaskSQL conversion failed")
		})
	}
}
