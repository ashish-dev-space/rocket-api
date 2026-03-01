package request

import "time"

// Request represents a single HTTP request (.bru file).
type Request struct {
	ID           string
	CollectionID string
	Name         string
	Method       string
	URL          string
	Headers      map[string]string
	Body         string
	BodyType     string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// NewRequest creates a new request instance.
func NewRequest(collectionID, name, method, url string) *Request {
	now := time.Now()
	return &Request{
		CollectionID: collectionID,
		Name:         name,
		Method:       method,
		URL:          url,
		Headers:      make(map[string]string),
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}
