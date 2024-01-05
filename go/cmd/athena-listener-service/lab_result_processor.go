package main

import (
	"context"
	"time"

	eventstreaming "github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

var changedLabResultsLastConsumedName = "changed_lab_results_last_consumed"

type LabResultProcessor struct {
	ctx          context.Context
	logger       *zap.SugaredLogger
	redisClient  *redisclient.Client
	athenaClient athenapb.AthenaServiceClient
}

func (p *LabResultProcessor) ProcessMessage(message eventstreaming.ConsumerMessage) error {
	defer func() {
		if r := recover(); r != nil {
			p.logger.Error("Recovered from panic: ", r)
		}
	}()

	var err error
	value := message.Value()
	if value == nil {
		err = errors.New("message.Value cannot be empty")
		p.logger.Error(err)
		return err
	}

	results, err := p.unmarshalLabResult(value)
	if err != nil {
		p.logger.Error(err)
		return err
	}

	doc, err := p.getLabResultDocument(results)
	if err != nil {
		p.logger.Error(err)
		return err
	}

	err = p.copyToPatientSummaryIfInterfaceDoc(results.GetPatientId(), doc)
	if err != nil {
		p.logger.Errorf("Failed to append Lab Result Analytes to Patient Goal Discussion Notes: %s", err)
		return err
	}

	err = p.updateLastConsumedTimestamp()
	if err != nil {
		p.logger.Error(err)
		return err
	}

	return nil
}

func (p *LabResultProcessor) updateLastConsumedTimestamp() error {
	currentTimestampUnix := time.Now().Unix()
	err := p.redisClient.Set(p.ctx, changedLabResultsLastConsumedName, currentTimestampUnix, 0)
	if err != nil {
		return errors.Wrap(err, "Failed to update last_processed_changed_lab_results timestamp")
	}

	return nil
}

func (p *LabResultProcessor) unmarshalLabResult(value []byte) (*athenapb.ListChangedLabResultsResult, error) {
	changedLabResult := &athenapb.ListChangedLabResultsResult{}
	err := proto.Unmarshal(value, changedLabResult)

	if err != nil {
		return nil, errors.Wrap(err, "Failed to unmarshal message.Value")
	}

	return changedLabResult, nil
}

func (p *LabResultProcessor) getLabResultDocument(changedLabResult *athenapb.ListChangedLabResultsResult) (*athenapb.LabResultDocument, error) {
	labResultID := changedLabResult.GetLabResultId()
	patientID := changedLabResult.GetPatientId()

	if labResultID == "" {
		return nil, errors.New("Lab Result ID is empty")
	}

	if patientID == "" {
		err := errors.New("Patient ID is empty")
		return nil, err
	}

	resp, err := p.athenaClient.GetPatientLabResultDocument(p.ctx, &athenapb.GetPatientLabResultDocumentRequest{PatientId: patientID, LabResultId: labResultID})

	if err != nil {
		err = errors.Wrap(err, "Failed to get patient Lab Result Document")
		return nil, err
	}

	if len(resp.Results) == 0 {
		return nil, errors.New("No Documents found for lab result")
	} else if len(resp.Results) > 1 {
		p.logger.Warnf("%s count results in Lab Result Document", len(resp.Results))
	}

	return resp.Results[0], nil
}

func (p *LabResultProcessor) copyToPatientSummaryIfInterfaceDoc(patientID string, labResultDoc *athenapb.LabResultDocument) error {
	if *labResultDoc.DocumentSource == "INTERFACE" {
		copier := &AnalyteCopier{AthenaClient: p.athenaClient}
		return copier.Copy(p.ctx, patientID, labResultDoc)
	}
	return nil
}
