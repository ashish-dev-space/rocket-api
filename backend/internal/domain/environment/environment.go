package environment

import "time"

// Environment represents a set of variables for different contexts (dev, staging, prod).
type Environment struct {
	ID        string
	Name      string
	Variables map[string]string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// NewEnvironment creates a new environment instance.
func NewEnvironment(name string) *Environment {
	now := time.Now()
	return &Environment{
		Name:      name,
		Variables: make(map[string]string),
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// SetVariable sets a variable in the environment.
func (e *Environment) SetVariable(key, value string) {
	e.Variables[key] = value
	e.UpdatedAt = time.Now()
}

// GetVariable retrieves a variable from the environment.
func (e *Environment) GetVariable(key string) (string, bool) {
	val, exists := e.Variables[key]
	return val, exists
}
