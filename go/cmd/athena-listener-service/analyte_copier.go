package main

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/pkg/errors"
)

type AnalyteCopier struct {
	AthenaClient athenapb.AthenaServiceClient
}

func (c AnalyteCopier) Copy(ctx context.Context, patientID string, doc *athenapb.LabResultDocument) error {
	if len(doc.Observations) == 0 {
		return errors.New("no analytes to copy from lab result document")
	}

	labResultID := doc.GetId()
	encounterID := doc.GetEncounterId()
	var err error
	if encounterID == "" {
		encounterID, err = c.getEncounterID(ctx, patientID, doc.GetOrderId())
		if err != nil {
			return err
		}
	}

	discussionNotes, err := c.getPatientDiscussionNotes(ctx, encounterID)
	if err != nil {
		return err
	}

	noteUpdates, err := converters.GenerateNotesFromAnalytes(labResultID, doc.Observations)
	if err != nil {
		return errors.Wrap(err, "failed to generate notes from analytes")
	}

	notesHaveLabResults := notesHaveLabResults(discussionNotes, labResultID)
	if notesHaveLabResults {
		noteUpdates = replaceLabResultsInNotes(labResultID, discussionNotes, noteUpdates)
	}

	_, err = c.AthenaClient.UpdatePatientDiscussionNotes(ctx, &athenapb.UpdatePatientDiscussionNotesRequest{EncounterId: encounterID, DiscussionNotes: noteUpdates, ReplaceDiscussionNotes: notesHaveLabResults})
	if err != nil {
		return errors.Wrap(err, "failed to update patient discussion notes")
	}

	return nil
}

func (c AnalyteCopier) getEncounterID(ctx context.Context, patientID, orderID string) (string, error) {
	resp, err := c.AthenaClient.GetPatientOrder(ctx, &athenapb.GetPatientOrderRequest{PatientId: patientID, OrderId: orderID})

	if err != nil {
		return "", err
	}

	return *resp.Order.EncounterId, nil
}

func (c AnalyteCopier) getPatientDiscussionNotes(ctx context.Context, encounterID string) (string, error) {
	resp, err := c.AthenaClient.GetPatientGoals(ctx, &athenapb.GetPatientGoalsRequest{EncounterId: encounterID})

	if err != nil {
		return "", err
	}

	return resp.DiscussionNotes, nil
}

func notesHaveLabResults(notes string, labResultID string) bool {
	return strings.Contains(notes, fmt.Sprintf("%s%s", `id="lab-result-id-`, labResultID))
}

func replaceLabResultsInNotes(labResultID string, originalNotes string, labResultStr string) string {
	var re = regexp.MustCompile(fmt.Sprintf("%s%s%s", `<h3 id="lab-result-id-`, labResultID, `">Lab Results</h3>.+</ul>`))
	return re.ReplaceAllLiteralString(originalNotes, labResultStr)
}
