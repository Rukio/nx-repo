package baselogger

import (
	"log"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	zapEncoderConfig = zapcore.EncoderConfig{
		MessageKey:     "message",
		LevelKey:       "level",
		TimeKey:        "ts",
		NameKey:        "logger",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
)

type LoggerOptions struct {
	ServiceName  string
	UseDevConfig bool
}

func NewSugaredLogger(opts LoggerOptions) *zap.SugaredLogger {
	config := zap.NewProductionConfig()
	if opts.UseDevConfig {
		config = zap.NewDevelopmentConfig()
		zapEncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}
	config.EncoderConfig = zapEncoderConfig

	logger, err := config.Build()
	if err != nil {
		log.Panic(err)
	}

	return logger.Named(opts.ServiceName).Sugar()
}
