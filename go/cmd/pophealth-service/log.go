package main

import (
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func LogErrorw(log *zap.SugaredLogger, message string, err error, fields ...any) {
	if err != nil {
		log.Errorw(message, fields, zap.Error(err))
	} else {
		log.Errorw(message, fields)
	}
}

func LogError(log *zap.SugaredLogger, message string, err error) {
	if err != nil {
		log.Error(message, zap.Error(err))
	} else {
		log.Error(message)
	}
}

func LogAndReturnErr(log *zap.SugaredLogger, code codes.Code, message string, err error, fields ...any) error {
	if len(fields) == 0 {
		LogError(log, message, err)
	} else {
		LogErrorw(log, message, err, fields)
	}
	return status.Errorf(code, "%s %v", message, err)
}
