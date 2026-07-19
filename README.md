# **Takım İsmi**

StyleMind AI

# Ürün İle İlgili Bilgiler

## Takım Elemanları

- Enes Buğra Damar: Scrum Master
- Oğuzhan Ünal: Product Owner
- İrem Damla Dural: Developer
- Atakan Tatar: Developer
- Merve Yıldız: Developer

## Ürün İsmi

--StyleMind AI--

## Ürün Açıklaması

- StyleMind AI, yapay zekâ destekli bir sanal dolap ve sürdürülebilir stil platformudur. Kullanıcının kıyafetlerini fotoğraftan otomatik olarak etiketleyerek (kategori, renk, mevsim) dijital bir gardırop oluşturur ve doğal dil komutlarıyla ("Bugün yağmurlu, iş görüşmem var") anlık, bağlama özel kombin önerileri sunar. Uygulama; gerçek zamanlı hava durumu, yıkama ve hijyen takvimi ile renk uyumu kurallarını birleştirerek eğilimlere değil kullanıcının kendi dolabına odaklanan bütünleşik bir deneyim sağlar. "Her gün doğru kombini bulmak artık bir tıklama uzağınızda."

## Ürün Özellikleri

- Fotoğraftan otomatik kıyafet etiketleme (kategori, ana renk, mevsim tespiti)
- Doğal dil komutuyla bağlama özel kombin üretimi (AI Stilist)
- Gerçek zamanlı hava durumuna göre kombin önerisi
- Yıkama, hijyen ve son giyilme tarihi takibi
- Sürdürülebilirlik yönlendirmeleri (uzun süre kullanılmayan ürünler için sat/bağışla)
- Kişisel dolap analitiği (hangi kıyafet ne sıklıkla giyiliyor)

## Hedef Kitle

- 18-35 yaş üniversite öğrencileri ve şehirli genç profesyoneller
- Karar yorgunluğu yaşayan ve zaman kazanmak isteyen kullanıcılar
- Sürdürülebilir moda tutkunları
- Stil danışmanları ve içerik üreticileri
- Gardırobunu daha verimli kullanmak isteyen herkes

## Product Backlog URL

---

# Sprint 1

- **Sprint Notları**: Bu sprintte StyleMind AI'nin temel iskeletinin oluşturulmasına odaklanılmıştır. Sanal Dolap veri modelinin kurulması, kullanıcının kıyafet fotoğrafı yükleyebileceği ekranın prototiplenmesi ve etiketleme akışının temel yapısının hazırlanması hedeflenmiştir. Takım içi rol dağılımı ilk toplantıda netleştirilmiş ve iş yükü developer'lar arasında dengeli şekilde paylaştırılmıştır.

- **Sprint içinde tamamlanması tahmin edilen puan**: Toplam backlog puanının yaklaşık yarısı ilk iki sprinte, kalanı son sprinte dağıtılacak şekilde planlanmıştır. Sprint 1 için hedeflenen puan, sprint kapasitesini aşmayacak şekilde belirlenmiştir.

- **Puan Tamamlama Mantığı**: Backlog'umuz ilk yapılacak story'lere göre düzenlenmiştir. Sprint başına tahmin edilen puan sayısını geçmeyecek şekilde sıradan seçimler yapılmaktadır. Story başına çıkan tahmin puanı, toplam puanın yarısından az tutulmuştur.

  Story'ler yapılacak işlere (task'lere) bölünmüştür.

- **Daily Scrum**: Daily Scrum toplantılarının zamansal sebeplerden ötürü Slack üzerinden yapılmasına karar verilmiştir.

- **Sprint Review**:
Alınan kararlar: Sanal dolap için veritabanı şemasının (kullanıcı, kıyafet, etiket tabloları) oluşturulması Sprint 1 içinde gerekli görülmüştür. Fotoğraftan otomatik etiketleme modelinin (Swin Transformer / ResNet) entegrasyonunun bu sprintte tam kapsamıyla ele alınamayacağı görülmüş, ilgili PBI bir sonraki sprint'e aktarılmıştır. Yüklenen kıyafet fotoğraflarının görüntülenmesi ve manuel etiketlenmesi akışında bir problem görülmemiştir. Kombin önerisi ekranı için eklenmesi gereken ekstra özellikler belirlenmiştir. Sprint Review katılımcıları: Oğuzhan Ünal, Enes Buğra Damar, İrem Damla Dural, Atakan Tatar, Merve Yıldız.

- **Sprint Retrospective:**
  - Takım içindeki görev dağılımıyla ilgili düzenleme yapılması kararı alınmıştır.
  - Tahmin puanları gözden geçirilmeli ve sprint planlama toplantılarında gerekli geri bildirimlerin developer'lar tarafından verildiğine emin olunmalı.
  - Görüntü işleme modelinin entegrasyonu için ayrılan efor/saat bir sonraki sprintte artırılmalı.
  - Slack üzerinden yürütülen Daily Scrum'ların düzenliliği korunmalı.

---

# Sprint 2

- **Sprint Notları**: Bu sprintte StyleMind AI'nin temel yapısının geliştirilmesine ve fotoğraftan otomatik kıyafet etiketleme özelliğinin uygulanmasına odaklanılmıştır. Sprint 1'de sayılan prototiplerin ileri seviyelere taşınması, yapay zeka modelinin (Swin Transformer / ResNet) gerçek projeye entegre edilmesi ve kombin önerisi algoritmasının temel mantığının kodlanması hedeflenmiştir. Takım, belirlenen görev dağılımında etkin bir şekilde ilerlemiş ve backend ile frontend arasında iletişim düzeni kurulmuştur.

- **Sprint içinde tamamlanması tahmin edilen puan**: Sprint 1'de alınan geri bildirimlere göre puan dağılımı yeniden düzenlenmiştir. Backlog'un kalan yarısı Sprint 2 ve Sprint 3'e dengeli şekilde paylaştırılmıştır. Sprint 2 için tahmin edilen puanlar, ekip kapasitesi ve önceki sprint'teki çıktılar dikkate alınarak belirlenmiştir.

- **Puan Tamamlama Mantığı**: Backlog'daki story'ler önceliğe göre yeniden sıralanmıştır. Bağımlılıkları olan task'ler öncelikli olarak ele alınmıştır. Story'ler detaylı şekilde task'lere bölünmüş, her task için tahmin puanları tekrardan değerlendirilmiştir.

  AI model entegrasyonuna yönelik task'ler daha ayrıntılı şekilde planlanmıştır.

- **Daily Scrum**: Slack üzerinden yürütülen Daily Scrum'lar düzenli olarak devam etmiştir. Takım üyeleri günlük kütüphaneler, engeller ve çıktıları paylaşmışlardır.

- **Sprint Review**:
Alınan kararlar: Fotoğraftan otomatik kıyafet etiketleme özelliği (kategori, ana renk, mevsim tespiti) başarıyla uygulanmıştır. Doğal dil komutuyla bağlama özel kombin üretimi (AI Stilist) özelliğinin temel altyapısı kurulmuştur. Gerçek zamanlı hava durumuna göre kombin önerisi özelliği tasarlanmış ve kısmi olarak uygulanmıştır. Yıkama, hijyen ve son giyilme tarihi takibi sistemi veritabanında tanımlanmıştır. Kişisel dolap analitiği için gerekli veri toplama mekanizmaları hazırlanmıştır. Sprint Review katılımcıları: Oğuzhan Ünal, Enes Buğra Damar, İrem Damla Dural, Atakan Tatar, Merve Yıldız.

- **Sprint Retrospective:**
  - AI model entegrasyonuyla ilgili teknik zorluklar dokümante edilmiş ve çözüm yolları belirlenmiştir.
  - Doğal dil işleme (NLP) kütüphanelerinin performansı üzerine çalışılmaya devam edilecektir.
  - Frontend ve backend arasındaki API tasarımında iyileştirmeler yapılmalıdır.
  - Gerçek zamanlı hava durumu API entegrasyonu test edilmelidir.
  - Takım üyeleri arasında teknik bilgi paylaşımı arttırılmalıdır.
  - Sprint 3 için sürdürülebilirlik yönlendirmeleri ve kullanıcı arayüzü geliştirmelerine ağırlık verilmelidir.

---

# Sprint 3

---
