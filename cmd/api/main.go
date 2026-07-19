package main

import (
	"log"

	"kombin/internal/config"
	"kombin/internal/delivery/http/controllers"
	"kombin/internal/delivery/http/routes"
	"kombin/internal/integration/gemini"
	"kombin/internal/repository"
	"kombin/internal/service"

	"github.com/gofiber/fiber/v2"
)

func main() {
	// 1. Konfigürasyonu yükle
	cfg := config.LoadConfig()

	// 2. Veri tabanına bağlan
	repository.ConnectDB(cfg)

	// 3. Harici servisleri (Gemini) başlat
	if cfg.GeminiAPIKey == "" {
		log.Println("Uyarı: GEMINI_API_KEY tanımlanmamış. AI özellikleri çalışmayabilir.")
	}
	geminiClient := gemini.NewClient(cfg.GeminiAPIKey)

	// 4. İş katmanını (Service) başlat
	geminiService := service.NewGeminiService(geminiClient)
	wardrobeService := service.NewWardrobeService(geminiClient)

	// 5. HTTP Kontrolcülerini başlat
	geminiController := controllers.NewGeminiController(geminiService)
	wardrobeController := controllers.NewWardrobeController(wardrobeService)

	// 6. Fiber uygulamasını başlat ve yapılandır
	app := fiber.New(fiber.Config{
		BodyLimit: 50 * 1024 * 1024, // 50 MB
		ErrorHandler: func(ctx *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return ctx.Status(code).JSON(fiber.Map{
				"error": "Sunucu hatası: " + err.Error(),
			})
		},
	})

	// Rotaları tanımla
	routes.SetupRoutes(app, geminiController, wardrobeController)

	// Uygulamayı ayağa kaldır
	log.Printf("Sunucu port %s üzerinde başlatılıyor...\n", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Sunucu başlatılamadı: %v", err)
	}
}
