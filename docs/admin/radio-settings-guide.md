# Radyo Ayarları Yönetim Kılavuzu

Bu kılavuz, TrendAnkara yönetim panelinde radyo ayarlarının nasıl yönetileceğini adım adım açıklar.

## İçindekiler

1. [Radyo Ayarlarına Erişim](#radyo-ayarlarına-erişim)
2. [Temel Ayarlar](#temel-ayarlar)
3. [Stream URL Yönetimi](#stream-url-yönetimi)
4. [Sosyal Medya Bağlantıları](#sosyal-medya-bağlantıları)
5. [Test İşlemleri](#test-işlemleri)
6. [Sorun Giderme](#sorun-giderme)
7. [İpuçları ve En İyi Uygulamalar](#ipuçları-ve-en-iyi-uygulamalar)

## Radyo Ayarlarına Erişim

### Gerekli Yetkiler

Radyo ayarlarını yönetebilmek için aşağıdaki yetkilerden birine sahip olmanız gerekir:

- **Admin**: Temel ayarları değiştirebilir (istasyon adı, açıklama, sosyal medya)
- **Super Admin**: Tüm ayarları değiştirebilir (stream URL'leri dahil)

### Radyo Ayarları Sayfasına Erişim

1. Yönetim paneline giriş yapın
2. Sol menüden **Ayarlar** > **Radyo Ayarları** seçeneğini tıklayın
3. Radyo ayarları formu açılacaktır

![Radyo Ayarları Menü Erişimi](.screenshots/radio-settings-menu.png)

## Temel Ayarlar

### İstasyon Adı

İstasyon adı, radyo oynatıcısında ve web sitesinde görüntülenen ana başlıktır.

**Adımlar:**
1. "İstasyon Adı" alanına istediğiniz adı yazın
2. Minimum 2, maksimum 100 karakter olmalıdır
3. Boş bırakılamaz (zorunlu alan)

**Örnek:** `Trend Ankara Radio`

### İstasyon Açıklaması

İstasyonunuzun kısa tanıtımını buraya yazabilirsiniz.

**Adımlar:**
1. "Açıklama" alanına istasyon tanıtımınızı yazın
2. Minimum 10, maksimum 500 karakter olmalıdır
3. Zorunlu alan değildir, ancak doldurulması önerilir

**Örnek:** `Ankara'nın en güncel müzik ve haber radyosu. 7/24 canlı yayın.`

### Değişiklikleri Kaydetme

1. Formdaki alanları doldurun
2. **Ayarları Kaydet** butonuna tıklayın
3. Başarı mesajını bekleyin
4. Radyo oynatıcısı otomatik olarak güncellenir

![Temel Ayarlar Formu](.screenshots/basic-settings-form.png)

## Stream URL Yönetimi

> **Uyarı:** Stream URL'lerini değiştirmek için **Super Admin** yetkisi gereklidir.

### Ana Stream URL

Bu, radyo yayını için kullanılan ana akış adresidir.

**Adımlar:**
1. "Ana Stream URL" alanına stream adresinizi girin
2. URL `http://` veya `https://` ile başlamalıdır
3. **Stream URL Test Et** butonuna tıklayın
4. Bağlantı başarılı ise yeşil mesaj görünür

**Örnek:** `https://stream.trendankara.com/radio`

### Yedek Stream URL

Ana stream'de sorun olması durumunda kullanılacak yedek adres.

**Adımlar:**
1. "Yedek Stream URL" alanına yedek adresinizi girin
2. Bu alan isteğe bağlıdır
3. Ana stream başarısız olursa otomatik olarak yedek kullanılır

### Stream Test İşlemi

Stream URL'lerinin çalışıp çalışmadığını kontrol etmek için:

1. Stream URL'sini girin
2. **Stream URL Test Et** butonuna tıklayın
3. Test sonucunu bekleyin (maksimum 10 saniye)
4. Sonuç mesajını inceleyin:
   - ✅ **Yeşil**: Bağlantı başarılı
   - ❌ **Kırmızı**: Bağlantı başarısız

![Stream Test Sonucu](.screenshots/stream-test-result.png)

### Test Sonucu Detayları

Başarılı test sonucunda şu bilgiler gösterilir:
- **Status Code**: HTTP yanıt kodu (200 olmalı)
- **Response Time**: Yanıt süresi (ms)
- **Content Type**: İçerik türü (audio/ ile başlamalı)

## Sosyal Medya Bağlantıları

### Desteklenen Platformlar

- Facebook Sayfası
- Twitter Profili
- Instagram Hesabı
- YouTube Kanalı

### Sosyal Medya URL'si Ekleme

1. İlgili sosyal medya alanına URL'yi girin
2. URL `http://` veya `https://` ile başlamalıdır
3. Tüm sosyal medya alanları isteğe bağlıdır
4. Yanlış format girilirse kırmızı hata mesajı gösterilir

**Doğru Format Örnekleri:**
- Facebook: `https://facebook.com/trendankara`
- Twitter: `https://twitter.com/trendankara`
- Instagram: `https://instagram.com/trendankara`
- YouTube: `https://youtube.com/c/trendankara`

### URL Doğrulama

Sosyal medya URL'leri otomatik olarak doğrulanır:
- ✅ Geçerli URL: Alan yeşil kenarlıkla gösterilir
- ❌ Geçersiz URL: Kırmızı hata mesajı ve kenarlık gösterilir

![Sosyal Medya URL Doğrulama](.screenshots/social-media-validation.png)

## Test İşlemleri

### Stream Bağlantı Testi

**Ne zaman kullanılır:**
- Yeni stream URL'si eklerken
- Mevcut stream'de sorun şüphesi varsa
- Periyodik kontroller için

**Test Süreci:**
1. Stream URL'sini girin
2. Test butonuna tıklayın
3. Loading animasyonu gösterilir
4. 10 saniye içinde sonuç alınır
5. Başarı/başarısızlık durumu gösterilir

### Hız Sınırlaması

Stream testleri hız sınırlamasına tabidir:
- **Limit**: Dakikada 10 test
- **Aşım durumu**: "Too many requests" mesajı
- **Bekleme süresi**: 1 dakika

### Test Sonuçlarını Anlama

**Başarılı Test:**
```
✅ Stream connection successful
Status Code: 200
Response Time: 156ms
Content Type: audio/mpeg
```

**Başarısız Test:**
```
❌ Stream connection failed
Error: Connection timeout
```

## Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. "Yetkisiz erişim" hatası

**Sebep:** Yeterli admin yetkisine sahip değilsiniz.
**Çözüm:** Site yöneticisinden yetki talep edin.

#### 2. Stream URL değiştirilemiyor

**Sebep:** Super Admin yetkisi gerekiyor.
**Çözüm:** Super Admin'den değişiklik talep edin veya yetki yükseltme isteyin.

#### 3. "Geçersiz URL formatı" hatası

**Sebep:** URL formatı yanlış.
**Çözüm:**
- URL'nin `http://` veya `https://` ile başladığından emin olun
- Türkçe karakter kullanmayın
- Boşluk bırakmayın

#### 4. Stream testi başarısız oluyor

**Olası Sebepler:**
- Stream sunucusu çalışmıyor
- URL yanlış yazılmış
- Ağ bağlantısı sorunu
- Stream sunucusu aşırı yüklü

**Çözüm Adımları:**
1. URL'yi tekrar kontrol edin
2. Tarayıcıda URL'yi direkt açmayı deneyin
3. Stream sağlayıcısıyla iletişime geçin
4. Yedek stream URL'sini test edin

#### 5. "Rate limit exceeded" hatası

**Sebep:** Çok fazla test yapıldı.
**Çözüm:** 1 dakika bekleyip tekrar deneyin.

#### 6. Değişiklikler kaydedilmiyor

**Kontrol Listesi:**
- [ ] İnternet bağlantınız var mı?
- [ ] Zorunlu alanlar dolu mu?
- [ ] URL formatları doğru mu?
- [ ] Yeterli yetkiniz var mı?

#### 7. Radyo oynatıcısı güncellenmiyor

**Çözüm:**
- Sayfayı yenileyin (F5)
- Tarayıcı önbelleğini temizleyin
- Ayarları tekrar kaydedin

### Hata Mesajları ve Anlamları

| Hata Mesajı | Anlamı | Çözüm |
|-------------|--------|-------|
| "İstasyon adı gereklidir" | Zorunlu alan boş | İstasyon adını girin |
| "Geçerli bir URL girin" | URL formatı yanlış | http:// veya https:// ile başlatın |
| "Super admin yetkisi gerekli" | Yetki yetersiz | Super Admin'den yardım isteyin |
| "Stream bağlantısı başarısız" | Stream URL çalışmıyor | URL'yi kontrol edin |
| "Çok fazla istek" | Rate limit aşıldı | 1 dakika bekleyin |

## İpuçları ve En İyi Uygulamalar

### Güvenlik

1. **Güvenli URL'ler Kullanın**
   - Mümkün olduğunca `https://` kullanın
   - HTTP sadece test amaçlı kullanın

2. **Yetki Yönetimi**
   - Stream URL değişikliklerini sadece Super Admin yapmalı
   - Regular admin'lere sadece gerekli yetkiler verilmeli

### Performans

1. **Stream Kalitesi**
   - 128kbps veya daha yüksek kalite kullanın
   - Kararlı bir stream sağlayıcısı seçin

2. **Yedek Plan**
   - Mutlaka yedek stream URL'si tanımlayın
   - Farklı sunuculardan yedek hazırlayın

### Kullanıcı Deneyimi

1. **Açıklayıcı İsimler**
   - İstasyon adını kısa ve hatırlanabilir yapın
   - Açıklamada istasyonun özelliklerini belirtin

2. **Sosyal Medya**
   - Tüm sosyal medya hesaplarını güncel tutun
   - URL'lerin doğru sayfaları açtığından emin olun

### Bakım ve İzleme

1. **Düzenli Kontroller**
   - Haftada bir stream testi yapın
   - Sosyal medya bağlantılarını kontrol edin

2. **Değişiklik Takibi**
   - Önemli değişiklikleri kaydedin
   - Test sonuçlarını dokümante edin

3. **Yedekleme**
   - Ayar değişikliklerinden önce mevcut ayarları not alın
   - Çalışan konfigürasyonları kaydedin

### Acil Durum Protokolü

Stream'de sorun olması durumunda:

1. **Hızlı Müdahale**
   - Ana stream'i test edin
   - Sorun varsa yedek stream'i aktif edin

2. **İletişim**
   - Stream sağlayıcısıyla iletişime geçin
   - Gerekirse dinleyicileri bilgilendirin

3. **Dokümantasyon**
   - Sorunu ve çözümü kaydedin
   - Gelecek için önlem alın

## Destek ve İletişim

### Teknik Destek

Sorun yaşadığınızda:

1. Bu kılavuzu kontrol edin
2. Sistem yöneticisine başvurun
3. Hata mesajını tam olarak kaydedin
4. Ekran görüntüsü alın

### Güncelleme Talepleri

Yeni özellik veya değişiklik taleplerinizi:
- Geliştirme ekibine iletin
- Detaylı açıklama yapın
- İş önceliğini belirtin

### Eğitim

Yeni kullanıcılar için:
- Bu kılavuzu okuyun
- Pratik yapın (test ortamında)
- Deneyimli kullanıcılardan yardım alın

---

**Son Güncelleme:** 2024-01-01
**Versiyon:** 1.0
**Hazırlayan:** TrendAnkara Geliştirme Ekibi