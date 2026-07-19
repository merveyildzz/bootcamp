package domain

import (
	"time"

	"gorm.io/gorm"
)

// User represents a system user
type User struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
	Email        string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	CreatedAt    time.Time      `gorm:"type:timestamp" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"type:timestamp" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// AiInteractionLog records Gemini API interactions
type AiInteractionLog struct {
	LogID            string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"log_id"`
	UserID           *uint     `gorm:"index" json:"user_id,omitempty"`
	PromptHash       string    `gorm:"type:varchar(255);index" json:"prompt_hash"`
	SystemPrompt     string    `gorm:"type:text" json:"system_prompt"`
	UserPrompt       string    `gorm:"type:text" json:"user_prompt"`
	AiResponse       string    `gorm:"type:text" json:"ai_response"`
	InputTokenCount  int       `gorm:"type:int" json:"input_token_count"`
	OutputTokenCount int       `gorm:"type:int" json:"output_token_count"`
	ResponseStatus   string    `gorm:"type:varchar(50)" json:"response_status"` // Success, Timeout, RateLimited, Error
	LatencyMs        int       `gorm:"type:int" json:"latency_ms"`
	CreatedAt        time.Time `gorm:"type:timestamp" json:"created_at"`
}

// CachedPrompt stores cached responses to optimize costs
type CachedPrompt struct {
	PromptHash     string    `gorm:"type:varchar(255);primaryKey" json:"prompt_hash"`
	CachedResponse string    `gorm:"type:text" json:"cached_response"`
	ExpiresAt      time.Time `gorm:"type:timestamp;index" json:"expires_at"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// WardrobeItem represents a piece of clothing in the user's virtual wardrobe
type WardrobeItem struct {
	ID          string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      *uint     `gorm:"index" json:"user_id,omitempty"`
	Category    string    `gorm:"type:varchar(100);not null" json:"category"` // Üst Giyim, Alt Giyim, Ayakkabı, Dış Giyim, Aksesuar
	Description string    `gorm:"type:text;not null" json:"description"`      // "Siyah deri ceket", "Beyaz oversize tişört" vb.
	ImageUrl    string    `gorm:"type:text" json:"image_url,omitempty"`
	CreatedAt   time.Time `gorm:"type:timestamp" json:"created_at"`
}
