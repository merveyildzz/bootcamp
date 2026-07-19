package service

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// SearchImage searches Bing Images and returns the first image URL
func SearchImage(query string) (string, error) {
	// Arama terimini güvenli hale getir ve sonuna 'png' veya 'kıyafet' ekle
	searchQuery := url.QueryEscape(query + " kıyafet png")
	searchUrl := fmt.Sprintf("https://www.bing.com/images/search?q=%s", searchQuery)

	req, err := http.NewRequest("GET", searchUrl, nil)
	if err != nil {
		return "", err
	}

	// Bot korumasına takılmamak için User-Agent ekliyoruz
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", fmt.Errorf("status code error: %d %s", res.StatusCode, res.Status)
	}

	// Goquery ile HTML'i parse et
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return "", err
	}

	var foundUrl string
	// Bing görseller genellikle <img class="mimg" src="..."> etiketlerinde döner.
	doc.Find("img.mimg").Each(func(i int, s *goquery.Selection) {
		if foundUrl != "" {
			return
		}
		src, exists := s.Attr("src")
		if !exists || src == "" {
			src, exists = s.Attr("data-src")
		}
		if exists && strings.HasPrefix(src, "http") {
			foundUrl = src
		}
	})

	// Url'yi temizle (Bing'in session query parametreleri resmi karartıyor)
	if foundUrl != "" {
		if idx := strings.Index(foundUrl, "?"); idx != -1 {
			foundUrl = foundUrl[:idx]
		}
	}

	if foundUrl == "" {
		return "", fmt.Errorf("görsel bulunamadı")
	}

	return foundUrl, nil
}
