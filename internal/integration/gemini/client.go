package gemini

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"strings"
	
	"kombin/internal/domain"

	"google.golang.org/genai"
)

// Client encapsulates the Gemini SDK client
type Client struct {
	genaiClient *genai.Client
	modelName   string
}

// NewClient initializes a new Gemini API client
func NewClient(apiKey string) *Client {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		log.Fatalf("Gemini istemcisi başlatılamadı: %v", err)
	}

	return &Client{
		genaiClient: client,
		modelName:   "gemini-2.5-flash", // Varsayılan hızlı model
	}
}

// GenerateContent sends a prompt to Gemini and returns the response
func (c *Client) GenerateContent(ctx context.Context, systemInstruction, userPrompt string, history []domain.ChatMessage) (string, error) {

	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: systemInstruction},
			},
		},
	}

	var contents []*genai.Content

	// Geçmişi (History) ekle
	for _, msg := range history {
		// Frontend "ai" olarak gönderiyor olabilir, gemini "model" bekler
		role := msg.Role
		if role == "ai" {
			role = "model"
		}
		
		contents = append(contents, &genai.Content{
			Role: role,
			Parts: []*genai.Part{
				{Text: msg.Content},
			},
		})
	}

	// Son kullanıcı mesajını ekle
	contents = append(contents, &genai.Content{
		Role: "user",
		Parts: []*genai.Part{
			{Text: userPrompt},
		},
	})

	resp, err := c.genaiClient.Models.GenerateContent(ctx, c.modelName, contents, config)
	if err != nil {
		return "", fmt.Errorf("gemini api hatası: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini api'den boş yanıt döndü")
	}

	responseText := resp.Candidates[0].Content.Parts[0].Text

	return responseText, nil
}

// AnalyzeImage takes a base64 image and returns a description of the clothing item
func (c *Client) AnalyzeImage(ctx context.Context, base64Data string) (string, error) {
	// Temel mime type temizliği (data:image/jpeg;base64,... -> ...)
	mimeType := "image/jpeg"
	data := base64Data
	if strings.HasPrefix(base64Data, "data:") {
		parts := strings.Split(base64Data, ",")
		if len(parts) == 2 {
			data = parts[1]
			mimeInfo := strings.Split(parts[0], ";")[0]
			mimeType = strings.TrimPrefix(mimeInfo, "data:")
		}
	}

	decodedData, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return "", fmt.Errorf("base64 decode hatası: %w", err)
	}

	prompt := "Bu fotoğraftaki kıyafeti kısa ve öz bir şekilde tanımla (örneğin: 'Mavi kot pantolon', 'Siyah deri ceket', 'Beyaz spor ayakkabı'). Yanıtta sadece kıyafetin adı ve rengi olsun, başka bir cümle kurma."

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				{Text: prompt},
				{
					InlineData: &genai.Blob{
						MIMEType: mimeType,
						Data:     decodedData,
					},
				},
			},
		},
	}

	resp, err := c.genaiClient.Models.GenerateContent(ctx, c.modelName, contents, nil)
	if err != nil {
		return "", fmt.Errorf("gemini vision hatası: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini vision'dan boş yanıt döndü")
	}

	return resp.Candidates[0].Content.Parts[0].Text, nil
}
