package logger

import (
	"github.com/sirupsen/logrus"
	"os"
)

type Logger interface {
	Debug(args ...interface{})
	Debugf(format string, args ...interface{})
	Info(args ...interface{})
	Infof(format string, args ...interface{})
	Warn(args ...interface{})
	Warnf(format string, args ...interface{})
	Error(args ...interface{})
	Errorf(format string, args ...interface{})
	Fatal(args ...interface{})
	Fatalf(format string, args ...interface{})
}

type logrusLogger struct {
	logger *logrus.Logger
}

func New(level string) Logger {
	log := logrus.New()
	log.SetOutput(os.Stdout)
	log.SetFormatter(&logrus.JSONFormatter{})

	lvl, err := logrus.ParseLevel(level)
	if err != nil {
		lvl = logrus.InfoLevel
	}
	log.SetLevel(lvl)

	return &logrusLogger{logger: log}
}

func (l *logrusLogger) Debug(args ...interface{})                 { l.logger.Debug(args...) }
func (l *logrusLogger) Debugf(format string, args ...interface{}) { l.logger.Debugf(format, args...) }
func (l *logrusLogger) Info(args ...interface{})                  { l.logger.Info(args...) }
func (l *logrusLogger) Infof(format string, args ...interface{})  { l.logger.Infof(format, args...) }
func (l *logrusLogger) Warn(args ...interface{})                  { l.logger.Warn(args...) }
func (l *logrusLogger) Warnf(format string, args ...interface{})  { l.logger.Warnf(format, args...) }
func (l *logrusLogger) Error(args ...interface{})                 { l.logger.Error(args...) }
func (l *logrusLogger) Errorf(format string, args ...interface{}) { l.logger.Errorf(format, args...) }
func (l *logrusLogger) Fatal(args ...interface{})                 { l.logger.Fatal(args...) }
func (l *logrusLogger) Fatalf(format string, args ...interface{}) { l.logger.Fatalf(format, args...) }

func NewNoop() Logger {
	log := logrus.New()
	log.SetOutput(os.Stderr)
	log.SetLevel(logrus.PanicLevel)
	return &logrusLogger{logger: log}
}
