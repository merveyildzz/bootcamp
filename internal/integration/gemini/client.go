package gemini

import (
	"context"
	"fmt"
	"log"

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
func (c *Client) GenerateContent(ctx context.Context, systemInstruction, userPrompt string) (string, error) {

	config := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				{Text: systemInstruction},
			},
		},
	}

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				{Text: userPrompt},
			},
		},
	}

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
