package controllers

import (
	"log"
	"kombin/internal/service"

	"github.com/gofiber/fiber/v2"
)

type WardrobeController struct {
	service *service.WardrobeService
}

func NewWardrobeController(s *service.WardrobeService) *WardrobeController {
	return &WardrobeController{
		service: s,
	}
}

func (c *WardrobeController) GetItems(ctx *fiber.Ctx) error {
	items, err := c.service.GetItems(ctx.Context())
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Eşyalar getirilirken hata oluştu.",
		})
	}
	return ctx.JSON(fiber.Map{
		"data": items,
	})
}

type AddWardrobeRequest struct {
	Category    string `json:"category"`
	Description string `json:"description"`
	ImageUrl    string `json:"image_url"`
}

func (c *WardrobeController) AddItem(ctx *fiber.Ctx) error {
	var req AddWardrobeRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Geçersiz istek",
		})
	}

	if req.Category == "" || req.Description == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Kategori ve açıklama zorunludur.",
		})
	}

	item, err := c.service.AddItem(ctx.Context(), req.Category, req.Description, req.ImageUrl)
	if err != nil {
		log.Printf("AddItem error: %v\n", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Eşya eklenirken hata oluştu.",
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": item,
	})
}

func (c *WardrobeController) DeleteItem(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID zorunludur",
		})
	}

	if err := c.service.DeleteItem(ctx.Context(), id); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Eşya silinirken hata oluştu",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "Eşya başarıyla silindi",
	})
}
