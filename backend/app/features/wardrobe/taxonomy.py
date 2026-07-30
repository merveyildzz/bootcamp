from enum import Enum


class Category(str, Enum):
    TISORT = "tişört"
    GOMLEK = "gömlek"
    KAZAK = "kazak"
    SWEATSHIRT = "sweatshirt"
    CEKET = "ceket"
    MONT = "mont"
    PANTOLON = "pantolon"
    KOT_PANTOLON = "kot pantolon"
    ESOFMAN_ALTI = "eşofman altı"
    ETEK = "etek"
    ELBISE = "elbise"
    SORT = "şort"
    AYAKKABI = "ayakkabı"
    BOT_CIZME = "bot / çizme"
    CANTA = "çanta"
    AKSESUAR = "aksesuar"
    IC_GIYIM = "iç giyim"


class Style(str, Enum):
    GUNLUK = "günlük"
    SPOR = "spor"
    KLASIK = "klasik"
    SIK = "şık"
    OFIS = "ofis"
    BOHEM = "bohem"
    MINIMAL = "minimal"


class Season(str, Enum):
    ILKBAHAR = "ilkbahar"
    YAZ = "yaz"
    SONBAHAR = "sonbahar"
    KIS = "kış"
    DORT_MEVSIM = "dört mevsim"


class Color(str, Enum):
    SIYAH = "siyah"
    BEYAZ = "beyaz"
    GRI = "gri"
    LACIVERT = "lacivert"
    MAVI = "mavi"
    KIRMIZI = "kırmızı"
    BORDO = "bordo"
    YESIL = "yeşil"
    SARI = "sarı"
    TURUNCU = "turuncu"
    PEMBE = "pembe"
    MOR = "mor"
    KAHVERENGI = "kahverengi"
    BEJ = "bej"
    KREM = "krem"
    DESENLI = "desenli"


TAXONOMY = {
    "category": [c.value for c in Category],
    "style": [s.value for s in Style],
    "season": [s.value for s in Season],
    "color": [c.value for c in Color],
}
