package routes

import (
	"kombin/internal/delivery/http/controllers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupRoutes(app *fiber.App, geminiCtrl *controllers.GeminiController) {
	// Temel Middleware'ler
	app.Use(cors.New()) // Allow all origins for dev
	app.Use(recover.New()) // Panic recovery
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))

	// Health Check
	app.Get("/api/v1/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "Backend çalışıyor."})
	})

	// V1 API Grup
	v1 := app.Group("/api/v1")
	
	// Gemini Rotaları
	v1.Post("/generate", geminiCtrl.Generate)
	v1.Get("/logs", geminiCtrl.GetLogs)
}
