package controllers

import (
	"kombin/internal/service"

	"github.com/gofiber/fiber/v2"
)

type GeminiController struct {
	service *service.GeminiService
}

func NewGeminiController(s *service.GeminiService) *GeminiController {
	return &GeminiController{
		service: s,
	}
}

type GenerateRequest struct {
	Prompt string `json:"prompt"`
}

func (c *GeminiController) Generate(ctx *fiber.Ctx) error {
	var req GenerateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Geçersiz istek formatı",
		})
	}

	if req.Prompt == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Prompt boş olamaz",
		})
	}

	response, err := c.service.ProcessPrompt(ctx.Context(), req.Prompt)
	if err != nil {
		// Sunucu tarafında hata loglanmalı, istemciye ise genel bir mesaj gönderilmelidir.
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "İşlem sırasında bir hata oluştu veya zaman aşımına uğradı.",
		})
	}

	return ctx.JSON(fiber.Map{
		"response": response,
	})
}

func (c *GeminiController) GetLogs(ctx *fiber.Ctx) error {
	logs, err := c.service.GetLogs(ctx.Context())
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Loglar getirilirken bir hata oluştu.",
		})
	}

	return ctx.JSON(fiber.Map{
		"data": logs,
	})
}
