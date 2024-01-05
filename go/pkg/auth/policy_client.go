package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"go.uber.org/zap"
)

type Allowable interface {
	Allowed(ctx context.Context, policy string, resource any) (bool, error)
}

type PolicyClientConfig struct {
	Client *http.Client
	Host   string
	Logger *zap.SugaredLogger
}

type PolicyClient struct {
	client *http.Client
	host   string
	logger *zap.SugaredLogger
}

type queryResult struct {
	Result any `json:"result"`
}

type QueryResults struct {
	Results []queryResult `json:"result"`
}

type queryError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Errors  []struct {
		Code     string `json:"code"`
		Message  string `json:"message"`
		Location struct {
			File string `json:"file"`
			Row  int    `json:"row"`
			Col  int    `json:"col"`
		} `json:"location"`
		Details struct {
			Line string `json:"line"`
			Idx  int    `json:"idx"`
		} `json:"details"`
	} `json:"errors"`
}

func newQueryError(code string, message string) *queryError {
	return &queryError{Code: code, Message: message}
}

func (qe queryError) Error() string {
	if len(qe.Code) > 0 {
		return fmt.Sprintf("%s: %s", qe.Code, qe.Message)
	}

	return qe.Message
}

func NewPolicyClient(config *PolicyClientConfig) *PolicyClient {
	client := config.Client
	if client == nil {
		client = http.DefaultClient
	}

	return &PolicyClient{
		client: client,
		host:   config.Host,
		logger: config.Logger,
	}
}

// Allowed gives a single result for a given policy, resource and actor.
func (pc *PolicyClient) Allowed(ctx context.Context, policy string, resource any) (bool, error) {
	result, err := pc.CheckPolicy(ctx, policy, resource)
	if err != nil {
		return false, err
	}

	return asBool(result), nil
}

// CheckPolicy gives a single result for a given policy, resource and actor.
func (pc *PolicyClient) CheckPolicy(ctx context.Context, policy string, resource any) (any, error) {
	actor, err := ActorFromContext(ctx)
	if err != nil {
		return nil, err
	}

	input := map[string]any{
		"actor":    actor,
		"resource": resource,
	}

	query := fmt.Sprintf("result = data.%s", policy)

	results, err := pc.Query(ctx, query, input)
	if err != nil {
		return nil, err
	}

	return extractPolicyResult(results, 0), nil
}

// Query gives a set of results for a given OPA query.
func (pc *PolicyClient) Query(ctx context.Context, query string, input any) (*QueryResults, error) {
	if len(query) == 0 {
		pc.logger.Error("no policy query specified")
		return nil, newQueryError("invalid policy query", "no policy query specified")
	}

	request := map[string]any{
		"query": query,
		"input": input,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		pc.logger.Errorw("invalid policy query", "request", request, zap.Error(err))
		return nil, newQueryError("invalid policy request", err.Error())
	}

	url := fmt.Sprintf("%s/v1/query", pc.host)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonData))
	if err != nil {
		pc.logger.Errorw("policy request error", "url", url, "body", jsonData, zap.Error(err))
		return nil, newQueryError("policy request error", err.Error())
	}
	req.Header.Add("Accept", "application/json")

	response, err := pc.client.Do(req)
	if err != nil {
		pc.logger.Errorw("policy server error", zap.Error(err))
		return nil, newQueryError("policy server error", err.Error())
	}
	defer response.Body.Close()

	responseData, err := io.ReadAll(response.Body)
	if err != nil {
		pc.logger.Errorf("policy response error: %w", err)
		return nil, newQueryError("policy response error", err.Error())
	}

	if response.StatusCode != http.StatusOK {
		qe := queryError{}
		err := json.Unmarshal(responseData, &qe)
		if err != nil {
			qe.Message = string(responseData)
		}
		return nil, qe
	}

	results := &QueryResults{}
	err = json.Unmarshal(responseData, results)
	if err != nil {
		pc.logger.Errorw("policy results error", zap.Error(err))
		return nil, newQueryError("policy results error", err.Error())
	}

	return results, nil
}

func extractPolicyResult(results *QueryResults, index int) any {
	if results == nil {
		return nil
	}

	if len(results.Results) <= index {
		return nil
	}

	return results.Results[index].Result
}

func asBool(value any) bool {
	boolValue, ok := value.(bool)
	if !ok {
		return false
	}

	return boolValue
}
