package service

import (
	"context"
	"time"

	"kombin/internal/domain"
	"kombin/internal/integration/gemini"
	"kombin/internal/repository"
)

type GeminiService struct {
	client *gemini.Client
}

func NewGeminiService(client *gemini.Client) *GeminiService {
	return &GeminiService{
		client: client,
	}
}

// ProcessPrompt handles the business logic, logging, and interaction with Gemini API
func (s *GeminiService) ProcessPrompt(ctx context.Context, userInput string) (string, error) {
	// Sistem talimatları arka planda tutularak prompt enjeksiyonuna karşı sterilizasyon sağlanır.
	systemInstruction := "Sen bir moda ve kombin asistanısın. Kullanıcıya kıyafet önerileri sunmalısın."
	
	start := time.Now()
	
	// API'ye maksimum 15 saniye timeout uygula
	timeoutCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// Gemini API çağrısı
	response, err := s.client.GenerateContent(timeoutCtx, systemInstruction, userInput)
	
	latencyMs := int(time.Since(start).Milliseconds())
	status := "Success"
	if err != nil {
		status = "Error"
		// TODO: Timeout vs RateLimited ayrımları yapılabilir.
	}

	// Etkileşim logunu asenkron olarak kaydet
	go s.logInteraction(systemInstruction, userInput, response, latencyMs, status)

	if err != nil {
		return "", err
	}

	return response, nil
}

func (s *GeminiService) logInteraction(sysPrompt, userPrompt, response string, latency int, status string) {
	logEntry := domain.AiInteractionLog{
		SystemPrompt:     sysPrompt,
		UserPrompt:       userPrompt,
		AiResponse:       response,
		ResponseStatus:   status,
		LatencyMs:        latency,
		// Token count can be added if SDK supports it in the response metadata easily.
	}

	// GORM will automatically save the created_at and generate new uuid
	if err := repository.DB.Create(&logEntry).Error; err != nil {
		// Log the error but do not crash the application
		// A dedicated logging package can be used here.
	}
}

// GetLogs fetches the AI interaction logs from the database
func (s *GeminiService) GetLogs(ctx context.Context) ([]domain.AiInteractionLog, error) {
	var logs []domain.AiInteractionLog
	// Fetch logs ordered by newest first, limit to 50 for now
	if err := repository.DB.Order("created_at desc").Limit(50).Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}
