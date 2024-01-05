# Job scheduler package

This package allows go server to setup cron jobs.

### Setup cron jobs

```go
// Will create job scheduler, add function as job and start cron service.
	scheduler := jobscheduler.NewJobScheduler(logger)
	err = scheduler.AddFunc(cronExpression, jobName, func() error {
		// some awesome logic or service function/rpc for scheduled call
		_, err := exampleService.GetVersion(context.Background(), nil)
		return err
	})
	if err != nil {
		logger.Panicw("could not add sync on call shifts job!", zap.Error(err))
	}
	scheduler.Start(ctx)
```
