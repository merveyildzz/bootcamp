package service

import (
	"context"
	"kombin/internal/domain"
	"kombin/internal/integration/gemini"
	"kombin/internal/repository"
)

type WardrobeService struct{
	geminiClient *gemini.Client
}

func NewWardrobeService(geminiClient *gemini.Client) *WardrobeService {
	return &WardrobeService{
		geminiClient: geminiClient,
	}
}

func (s *WardrobeService) GetItems(ctx context.Context) ([]domain.WardrobeItem, error) {
	var items []domain.WardrobeItem
	// Fetch all items (in a real app, filter by UserID)
	if err := repository.DB.Order("created_at desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (s *WardrobeService) AddItem(ctx context.Context, category, description, imageUrl string) (*domain.WardrobeItem, error) {
	// 1. Eğer base64 resim geldiyse, Gemini ile ne olduğunu algıla
	if imageUrl != "" && len(imageUrl) > 100 { // base64 payload
		visionDesc, err := s.geminiClient.AnalyzeImage(ctx, imageUrl)
		if err == nil && visionDesc != "" {
			description = visionDesc
			// İsteğe bağlı olarak category'i de visionDesc'e göre değiştirebiliriz
			// Şimdilik sadece açıklama güncelleniyor
		}
	}

	// 2. Açıklama veya Gemini sonucu var ise, internetten PNG fotoğrafını bul
	finalImageUrl := imageUrl // default
	if description != "" {
		searchedUrl, err := SearchImage(description)
		if err == nil && searchedUrl != "" {
			finalImageUrl = searchedUrl
		} else if len(imageUrl) > 100 {
			// Eğer arama başarısız olursa, çok büyük base64 yerine boş string koy
			finalImageUrl = "" 
		}
	} else if len(imageUrl) > 100 {
		finalImageUrl = "" // Base64 DB'yi şişirmesin
	}

	item := domain.WardrobeItem{
		Category:    category,
		Description: description,
		ImageUrl:    finalImageUrl,
	}

	if err := repository.DB.Create(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

func (s *WardrobeService) DeleteItem(ctx context.Context, id string) error {
	if err := repository.DB.Where("id = ?", id).Delete(&domain.WardrobeItem{}).Error; err != nil {
		return err
	}
	return nil
}
