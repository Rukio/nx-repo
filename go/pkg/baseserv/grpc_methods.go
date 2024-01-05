package baseserv

import (
	"fmt"
	"strings"
)

const fullMethodNameTemplate = "/%s/%s"

func GrpcFullMethodStringFromProtoQualifiedName(methodName string) string {
	lastIndex := strings.LastIndex(methodName, ".")
	if lastIndex < 0 {
		return methodName
	}

	method := methodName[lastIndex+1:]
	serviceName := methodName[:lastIndex]

	return fmt.Sprintf(fullMethodNameTemplate, serviceName, method)
}
