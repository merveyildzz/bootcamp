package repository

import (
	"log"
	"time"

	"kombin/internal/config"
	"kombin/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB exported db instance
var DB *gorm.DB

// ConnectDB establishes a connection to the PostgreSQL Database
func ConnectDB(cfg *config.Config) {
	if cfg.SupabaseURL == "" {
		log.Fatalf("Veri tabanına bağlanılamadı: SUPABASE_DB_URL tanımlanmamış.")
	}

	db, err := gorm.Open(postgres.Open(cfg.SupabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Veri tabanına bağlanılamadı: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Veri tabanı nesnesi alınamadı: %v", err)
	}

	// Connection Pool settings
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrate tables
	err = db.AutoMigrate(
		&domain.User{},
		&domain.AiInteractionLog{},
		&domain.CachedPrompt{},
	)
	if err != nil {
		log.Fatalf("Veri tabanı migrasyonu başarısız: %v", err)
	}

	DB = db
	log.Println("Veri tabanı bağlantısı ve migrasyon başarılı.")
}
