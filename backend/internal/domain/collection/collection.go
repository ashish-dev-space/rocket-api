package collection

import "time"

// Collection represents a group of API requests organized together.
type Collection struct {
	ID          string
	Name        string
	Description string
	Path        string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewCollection creates a new collection instance.
func NewCollection(name, description, path string) *Collection {
	now := time.Now()
	return &Collection{
		Name:        name,
		Description: description,
		Path:        path,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
