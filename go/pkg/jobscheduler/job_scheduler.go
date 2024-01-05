package jobscheduler

import (
	"context"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

const (
	jobNameKey = "job name"
)

type JobScheduler struct {
	cron   *cron.Cron
	logger *zap.SugaredLogger
}

func NewJobScheduler(logger *zap.SugaredLogger) *JobScheduler {
	return &JobScheduler{
		cron: cron.New(
			cron.WithParser(
				cron.NewParser(
					cron.SecondOptional | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow))),
		logger: logger,
	}
}

func (js *JobScheduler) AddFunc(cronExpression, jobName string, jobFunc func() error) error {
	_, err := js.cron.AddFunc(cronExpression, func() {
		js.logger.Infow("JobScheduler job started", jobNameKey, jobName)
		err := jobFunc()
		if err != nil {
			js.logger.Errorw("JobScheduler error running job", jobNameKey, jobName, zap.Error(err))
		}
		js.logger.Infow("JobScheduler job finished", jobNameKey, jobName)
	})
	return err
}

func (js *JobScheduler) Start(ctx context.Context) {
	go func() {
		js.cron.Start()
		defer js.cron.Stop()

		<-ctx.Done()
	}()
}
