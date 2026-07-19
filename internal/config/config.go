package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	SupabaseURL  string
	GeminiAPIKey string
}

func LoadConfig() *Config {
	err := godotenv.Load(".env")
	if err != nil {
		log.Println("Uyarı: .env dosyası bulunamadı veya okunamadı. Sistem ortam değişkenleri kullanılacak.")
	}

	return &Config{
		Port:         getEnv("PORT", "3000"),
		SupabaseURL:  getEnv("SUPABASE_DB_URL", ""),
		GeminiAPIKey: getEnv("GEMINI_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
