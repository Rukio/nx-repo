package main

import (
	"context"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/bsm/redislock"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

const (
	subscribeToAthenaPatientLabResultsStatsigName = "subscribe_to_athena_patient_lab_results"
	appendAthenaPatientLabResultsStatsigName      = "athena_listener_append_lab_results"
	subscribeToAthenaPatientsStatsigName          = "subscribe_to_athena_patients"
	datadogMessagesSentMetric                     = "athena_listener.messages.sent"
	changedLabResultsDirtyBitName                 = "changed_lab_results_dirty_bit"
	changedLabResultsLastProcessedName            = "changed_lab_results_last_processed"
	defaultListChangedLimit                       = 1500
	labResultsListenerLockName                    = "lab_results_listener_lock"
	patientsListenerLockName                      = "patients_listener_lock"
	changedPatientsDirtyBitName                   = "changed_patients_dirty_bit"
	changedPatientsLastProcessedName              = "changed_patients_last_processed"
)

type Listener struct {
	AthenaClient     athenapb.AthenaServiceClient
	RedisClient      *redisclient.Client
	Locker           *redislock.Client
	LockExpiry       time.Duration
	DataDogRecorder  *monitoring.DataDogRecorder
	Logger           *zap.SugaredLogger
	StatsigProvider  *providers.StatsigProvider
	PollInterval     *time.Duration
	Producer         eventstreaming.MessageProducer
	LeaveUnprocessed bool
	ConsumerGroup    eventstreaming.ConsumerGroup
}

func (l Listener) Initialize(ctx context.Context) error {
	err := l.InitializeLabResultsSubscription(ctx)
	if err != nil {
		return err
	}

	if l.StatsigProvider.Bool(subscribeToAthenaPatientsStatsigName, false) {
		err := l.InitializePatientsSubscription(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (l Listener) InitializeLabResultsSubscription(ctx context.Context) error {
	s, err := l.AthenaClient.CheckLabResultsSubscriptionStatus(ctx, &athenapb.CheckLabResultsSubscriptionStatusRequest{})
	if err != nil {
		return err
	}

	if s != nil && s.Status != athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE {
		_, err = l.AthenaClient.SubscribeLabResultEvents(ctx, &athenapb.SubscribeLabResultEventsRequest{})
		if err != nil {
			return err
		}
	}
	return nil
}

func (l Listener) InitializePatientsSubscription(ctx context.Context) error {
	s, err := l.AthenaClient.CheckPatientsSubscriptionStatus(ctx, &athenapb.CheckPatientsSubscriptionStatusRequest{})
	if err != nil {
		return err
	}

	if s != nil && s.Status != athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE {
		_, err = l.AthenaClient.SubscribePatientEvents(ctx, &athenapb.SubscribePatientEventsRequest{})
		if err != nil {
			return err
		}
	}
	return nil
}

func (l Listener) Start(ctx context.Context) {
	l.StartPolling(ctx, subscribeToAthenaPatientsStatsigName, l.PollForPatients)
	l.StartPolling(ctx, subscribeToAthenaPatientLabResultsStatsigName, l.PollForLabResults)
	l.ConsumerGroup.Start(ctx)
	l.consumeKafkaMessages(ctx, l.ConsumerGroup, appendAthenaPatientLabResultsStatsigName)
}

func (l Listener) StartPolling(ctx context.Context, flag string, poller func(context.Context) error) {
	go func() {
		for {
			// Stop polling if the flag has been set to false.
			if l.StatsigProvider.Bool(flag, false) {
				err := poller(ctx)
				if err != nil {
					// Log if there was an unrecoverable error in the poller method.
					// In practice, this would be if Redis is down.
					l.Logger.Errorf("Failed to poll: %s", err)
				}
			}

			select {
			case <-ctx.Done():
				l.Logger.Infof("context done for flag %s, exiting polling loop", flag)
				return
			case <-time.After(*l.PollInterval):
				continue
			}
		}
	}()
}

// Polls for patients and sends them to Kafka.
// First, a lock will be acquired to prevent other listeners from modifying state.
// To check if the Listener is recovering from a crashed state, the method will check the "dirty bit"; if the dirty bit
// is set, then we will first backfill all patients that are marked in Athena as already processed since the last successful poll.
// Then, we will query Athena for the list of unprocessed patients since the last successful poll.
func (l Listener) PollForPatients(ctx context.Context) error {
	lock, err := l.Locker.Obtain(ctx, patientsListenerLockName, l.LockExpiry, nil)
	if err != nil {
		l.Logger.Errorw("Failed to obtain redis lock", "name", labResultsListenerLockName, zap.Error(err))
		return err
	}
	// If lock.Release throws ErrLockNotHeld, then we're already in a good state.
	defer lock.Release(ctx) //nolint:errcheck

	currentTimestampUnix := time.Now().Unix()
	// If dirty bit is true, that means that we did not exit gracefully last time PollForPatients was called.
	// Thus, we may need to backfill patients.
	err = l.backfillPatientsIfDirty(ctx, currentTimestampUnix)
	if err != nil {
		l.Logger.Errorf("Failed to get %s from redis: %s", changedPatientsLastProcessedName, err)
		return err
	}
	// Set dirty bit to true before getting changes from Athena, so we can keep track of if we exited gracefully.
	err = l.RedisClient.Set(ctx, changedPatientsDirtyBitName, true, 0)
	if err != nil {
		l.Logger.Errorf("Failed to set %s to true: %s", changedPatientsDirtyBitName, err)
		return err
	}

	results, err := l.getAllPatients(ctx, &athenapb.ListChangedPatientsRequest{
		LeaveUnprocessed: &l.LeaveUnprocessed,
	})
	if err != nil {
		l.Logger.Errorf("Failed to get lab results from Athena: %s", err)
		return err
	}

	numMessagesSent := l.sendPatientsToKafka(results)
	l.sendNumMessagesMetric(numMessagesSent, monitoring.Tags{
		"topic":    changedPatientsTopicName,
		"backfill": "false",
	})

	err = l.RedisClient.Set(ctx, changedPatientsDirtyBitName, false, 0)
	if err != nil {
		l.Logger.Errorf("Failed to set %s to false: %s", changedPatientsDirtyBitName, err)
		return err
	}
	err = l.RedisClient.Set(ctx, changedPatientsLastProcessedName, currentTimestampUnix, 0)
	if err != nil {
		l.Logger.Errorf("Failed to update last_processed_changed_patients timestamp: %s", err)
		return err
	}

	return nil
}

// Polls for lab results and sends them to Kafka.
// First, a lock will be acquired to prevent other listeners from modifying state.
// To check if the Listener is recovering from a crashed state, the method will check the "dirty bit"; if the dirty bit
// is set, then we will first backfill all lab results that are marked in Athena as already processed since the last successful poll.
// Then, we will query Athena for the list of unprocessed lab results since the last successful poll.
func (l Listener) PollForLabResults(ctx context.Context) error {
	lock, err := l.Locker.Obtain(ctx, labResultsListenerLockName, l.LockExpiry, nil)
	if err != nil {
		l.Logger.Errorw("Failed to obtain redis lock", "name", labResultsListenerLockName, zap.Error(err))
		return err
	}
	// If lock.Release throws ErrLockNotHeld, then we're already in a good state.
	defer lock.Release(ctx) //nolint:errcheck

	currentTimestampUnix := time.Now().Unix()
	// If dirty bit is true, that means that we did not exit gracefully last time PollForLabResults was called.
	// Thus, we may need to backfill lab results.
	err = l.backfillLabResultsIfDirty(ctx, currentTimestampUnix)
	if err != nil {
		l.Logger.Errorf("Failed to get changed_lab_results_last_processed from redis: %s", err)
		return err
	}
	// Set dirty bit to true before getting changes from Athena, so we can keep track of if we exited gracefully.
	err = l.RedisClient.Set(ctx, changedLabResultsDirtyBitName, true, 0)
	if err != nil {
		l.Logger.Errorf("Failed to set last_processed_changed_dirty_bit to true: %s", err)
		return err
	}

	results, err := l.getAllLabResults(ctx, &athenapb.ListChangedLabResultsRequest{
		LeaveUnprocessed: &l.LeaveUnprocessed,
	})
	if err != nil {
		l.Logger.Errorf("Failed to get lab results from Athena: %s", err)
		return err
	}

	numMessagesSent := l.sendLabResultsToKafka(results)
	l.sendNumMessagesMetric(numMessagesSent, monitoring.Tags{
		"topic":    changedLabResultsTopicName,
		"backfill": "false",
	})

	err = l.RedisClient.Set(ctx, changedLabResultsDirtyBitName, false, 0)
	if err != nil {
		l.Logger.Errorf("Failed to set last_processed_changed_dirty_bit to false: %s", err)
		return err
	}
	err = l.RedisClient.Set(ctx, changedLabResultsLastProcessedName, currentTimestampUnix, 0)
	if err != nil {
		l.Logger.Errorf("Failed to update last_processed_changed_lab_results timestamp: %s", err)
		return err
	}

	return nil
}

func (l Listener) backfillPatientsIfDirty(ctx context.Context, currentTimestampUnix int64) error {
	isDirty, err := l.getDirtyBit(ctx, changedPatientsDirtyBitName)
	if err != nil {
		l.Logger.Errorf("Failed to get %s from redis: %s", changedPatientsDirtyBitName, err)
		return err
	}
	if !isDirty {
		return nil
	}
	lastProcessedTimestampUnix, err := l.RedisClient.Get(ctx, changedPatientsLastProcessedName).Int64()
	if err != nil {
		if !errors.Is(err, redisclient.Nil) {
			return err
		}
		// If changedPatientsLastProcessedName is empty, then we have no info about when we last processed.
		// In this case, we should just not worry about backfilling.
		return nil
	}
	lastProcessedTimestamp, err := easternTimeStrFromUnix(lastProcessedTimestampUnix)
	if err != nil {
		return err
	}
	currentTimestamp, err := easternTimeStrFromUnix(currentTimestampUnix)
	if err != nil {
		return err
	}
	results, err := l.getAllPatients(ctx, &athenapb.ListChangedPatientsRequest{
		ShowProcessedStartDatetime: proto.String(lastProcessedTimestamp),
		ShowProcessedEndDatetime:   proto.String(currentTimestamp),
		Limit:                      proto.Int32(defaultListChangedLimit),
		LeaveUnprocessed:           &l.LeaveUnprocessed,
	})
	if err != nil {
		return err
	}
	// Since dirty bit is true, we have no guarantee previously-consumed patient results were sent to Kafka.
	// Set these params to ensure we reprocess previously-consumed patient results in Kafka.
	numMessagesSent := l.sendPatientsToKafka(results)

	l.sendNumMessagesMetric(numMessagesSent, monitoring.Tags{
		"topic":    changedLabResultsTopicName,
		"backfill": "true",
	})
	return nil
}

func (l Listener) backfillLabResultsIfDirty(ctx context.Context, currentTimestampUnix int64) error {
	isDirty, err := l.getDirtyBit(ctx, changedLabResultsDirtyBitName)
	if err != nil {
		l.Logger.Errorf("Failed to get changed_lab_results_dirty_bit from redis: %s", err)
		return err
	}
	if !isDirty {
		return nil
	}
	lastProcessedTimestampUnix, err := l.RedisClient.Get(ctx, changedLabResultsLastProcessedName).Int64()
	if err != nil {
		if !errors.Is(err, redisclient.Nil) {
			l.Logger.Errorf("backfillLabResultsIfDirty nil error: %s", err.Error())
			return err
		}
		// If changedLabResultsLastProcessedName is empty, then we have no info about when we last processed.
		// In this case, we should just not worry about backfilling.
		l.Logger.Errorf("backfillLabResultsIfDirty other error: %s", err.Error())
		return nil
	}
	lastProcessedTimestamp, err := easternTimeStrFromUnix(lastProcessedTimestampUnix)
	if err != nil {
		return err
	}
	currentTimestamp, err := easternTimeStrFromUnix(currentTimestampUnix)
	if err != nil {
		return err
	}
	results, err := l.getAllLabResults(ctx, &athenapb.ListChangedLabResultsRequest{
		ShowProcessedStartDatetime: proto.String(lastProcessedTimestamp),
		ShowProcessedEndDatetime:   proto.String(currentTimestamp),
		Limit:                      proto.Int32(defaultListChangedLimit),
		LeaveUnprocessed:           &l.LeaveUnprocessed,
	})
	if err != nil {
		l.Logger.Errorf("getAllLabResults other error: %s", err.Error())

		return err
	}
	// Since dirty bit is true, we have no guarantee previously-consumed results were sent to Kafka.
	// Set these params to ensure we reprocess previously-consumed results in Kafka.
	numMessagesSent := l.sendLabResultsToKafka(results)

	l.sendNumMessagesMetric(numMessagesSent, monitoring.Tags{
		"topic":    changedLabResultsTopicName,
		"backfill": "true",
	})
	return nil
}

// Get list of changed patients. If ShowProcessedStartDatetime and ShowProcessedEndDatetime and Limit are set, it will make successive calls to the API
// until the length of the response is less than the limit, and append those responses to the final return value.
func (l Listener) getAllPatients(ctx context.Context, params *athenapb.ListChangedPatientsRequest) ([]*athenapb.ListChangedPatientsResult, error) {
	var patientChanges []*athenapb.ListChangedPatientsResult
	patientsList, err := l.AthenaClient.ListChangedPatients(ctx, params)
	if err != nil || patientsList == nil {
		return patientChanges, err
	}
	patientChanges = patientsList.GetResults()

	if params.ShowProcessedStartDatetime != nil && params.ShowProcessedEndDatetime != nil && params.GetLimit() != 0 {
		for len(patientsList.Results) == int(params.GetLimit()) {
			newOffset := params.GetOffset() + params.GetLimit()
			params = &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: params.ShowProcessedStartDatetime,
				ShowProcessedEndDatetime:   params.ShowProcessedEndDatetime,
				Limit:                      params.Limit,
				Offset:                     &newOffset,
				LeaveUnprocessed:           params.LeaveUnprocessed,
			}
			patientsList, err = l.AthenaClient.ListChangedPatients(ctx, params)
			if err != nil {
				return patientChanges, err
			}
			patientChanges = append(patientChanges, patientsList.Results...)
		}
	}
	return patientChanges, err
}

// Get list of changed lab results. If ShowProcessedStartDatetime and ShowProcessedEndDatetime and Limit are set, it will make successive calls to the API
// until the length of the response is less than the limit, and append those responses to the final return value.
func (l Listener) getAllLabResults(ctx context.Context, params *athenapb.ListChangedLabResultsRequest) ([]*athenapb.ListChangedLabResultsResult, error) {
	var labResults []*athenapb.ListChangedLabResultsResult
	labs, err := l.AthenaClient.ListChangedLabResults(ctx, params)
	if err != nil || labs == nil {
		return labResults, err
	}
	labResults = labs.GetResults()

	if params.ShowProcessedStartDatetime != nil && params.ShowProcessedEndDatetime != nil && params.GetLimit() != 0 {
		for len(labs.Results) == int(params.GetLimit()) {
			newOffset := params.GetOffset() + params.GetLimit()
			params = &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: params.ShowProcessedStartDatetime,
				ShowProcessedEndDatetime:   params.ShowProcessedEndDatetime,
				Limit:                      params.Limit,
				Offset:                     &newOffset,
				LeaveUnprocessed:           params.LeaveUnprocessed,
			}
			labs, err = l.AthenaClient.ListChangedLabResults(ctx, params)
			if err != nil {
				return labResults, err
			}
			labResults = append(labResults, labs.Results...)
		}
	}
	return labResults, err
}

// Gets all patients and pushes each one into the Kafka topic. Also sends metrics to Datadog.
func (l Listener) sendPatientsToKafka(patients []*athenapb.ListChangedPatientsResult) int {
	var numMessagesSent int
	for _, result := range patients {
		marshaledPatient, err := proto.Marshal(result)
		if err != nil {
			l.Logger.Errorf("AthenaListener failed to marshal patient with id %s", result.GetPatientId())
			continue
		}
		err = l.Producer.SendMessage(&eventstreaming.ProducerMessage{Topic: changedPatientsTopicName, Value: marshaledPatient})
		if err != nil {
			l.Logger.Errorf("AthenaListener failed to send message with patient %v: %v", result, err)
			continue
		}
		numMessagesSent++
	}
	return numMessagesSent
}

// Gets all lab results and pushes each one into the Kafka topic. Also sends metrics to Datadog.
func (l Listener) sendLabResultsToKafka(labResults []*athenapb.ListChangedLabResultsResult) int {
	var numMessagesSent int
	for _, result := range labResults {
		marshaledLabResult, err := proto.Marshal(result)
		if err != nil {
			l.Logger.Errorf("AthenaListener failed to marshal lab result with id %s", result.GetLabResultId())
			continue
		}
		err = l.Producer.SendMessage(&eventstreaming.ProducerMessage{Topic: changedLabResultsTopicName, Value: marshaledLabResult})
		if err != nil {
			l.Logger.Errorf("AthenaListener failed to send message with lab result %v: %v", result, err)
			continue
		}
		numMessagesSent++
	}
	return numMessagesSent
}

func (l Listener) sendNumMessagesMetric(numMessagesSent int, tags monitoring.Tags) {
	if l.DataDogRecorder == nil {
		l.Logger.Info("Datadog recorder is not running! Would have recorded: %s, %d, %v", datadogMessagesSentMetric, numMessagesSent, tags)
		return
	}
	l.DataDogRecorder.Count(datadogMessagesSentMetric, int64(numMessagesSent), tags)
}

func (l Listener) getDirtyBit(ctx context.Context, key string) (bool, error) {
	isDirty, err := l.RedisClient.Get(ctx, key).Bool()
	if err != nil {
		if !errors.Is(err, redisclient.Nil) {
			return false, err
		}
		isDirty = false
	}
	return isDirty, nil
}

func (l Listener) consumeKafkaMessages(ctx context.Context, consumerGroup eventstreaming.ConsumerGroup, flag string) {
	l.Logger.Info("beginning kafka consumer loop")
	go func() {
		for {
			// Stop consumer group if the flag has been set to false.
			if l.StatsigProvider.Bool(flag, false) {
				consumerGroup.Resume()
			} else {
				consumerGroup.Pause()
			}

			select {
			case err := <-consumerGroup.Error():
				l.Logger.Errorf("Athena Listener consumer error: %v", err)
				continue
			case <-ctx.Done():
				if err := consumerGroup.Stop(); err != nil {
					l.Logger.Panicf("Error stopping consumer group: %v", err)
				}
				l.Logger.Info("terminating: context cancelled")
				return
			case <-time.After(*l.PollInterval):
				continue
			}
		}
	}()
}

// Athena API for lab result change events assumes an Eastern time and formatting does not allow a tz.
// Formatting noted in the Athena API docs is "mm/dd/yyyy hh24:mi:ss" (Eastern).
func easternTimeStrFromUnix(unixTime int64) (string, error) {
	ny, err := time.LoadLocation("America/New_York")
	if err != nil {
		return "", err
	}
	t := time.Unix(unixTime, 0).In(ny)
	return fmt.Sprintf("%02d/%02d/%04d %02d:%02d:%02d",
		t.Month(), t.Day(), t.Year(),
		t.Hour(), t.Minute(), t.Second()), nil
}
