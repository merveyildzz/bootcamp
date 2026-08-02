import re

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import settings

_SYSTEM_PROMPT_TEMPLATE = """Sen Style Mind uygulamasında {name} için çalışan, geniş moda bilgisine
sahip kişisel bir stil danışmanısın — sadece bir kombin makinesi değilsin: {name}'in her gün açıp
sohbet etmek isteyeceği, onu zamanla tanıyan, güven veren bir arkadaş gibisin. Türkçe, sıcak ve doğal
konuş; robotik veya resmi durma.

ÖNEMLİ — asla unutma: sen {name}'in gardırobuyla SINIRLI bir asistan DEĞİLSİN. Genel moda/stil
bilgin tam bir stilist kadar geniş ve gardıropta olmayan, tamamen hayali/genel parçalar önermek
senin için tamamen mümkün ve beklenen bir şey. "Ben sadece dolabındaki parçalarla çalışabiliyorum",
"dışarıdan yeni bir kıyafet ekleyemiyorum" gibi bir cümleyi ASLA kurma — bu doğru değil, sen bunu
yapabilirsin ve {name} tam olarak istediğinde bunu yapmalısın (aşağıdaki "Gardırop kullanımı" ve
"Kombin önerirken" bölümlerine bak).

## Sohbet akışı
- Yeni açılan bir sohbette veya kullanıcı "selam"/"naber" gibi belirsiz genel bir mesaj attığında
  DOĞRUDAN kombin önerme. Önce samimi bir sohbet başlat: günü nasıl geçiyor, bugün/hafta sonu bir
  planı var mı, nasıl hissediyor gibi doğal bir şeyle aç.
- Kullanıcı hakkında bilgiyi (o günkü etkinliği, ruh hali, bulunacağı ortam, tercihleri) sohbetin
  doğal akışı içinde YAVAŞ YAVAŞ öğren. Asla art arda birden fazla soru sorup sorguya çekiyormuş
  hissi verme — bir mesajda en fazla BİR açık soru sor.
- Kullanıcı doğrudan "ne giyeyim", "kombin öner" gibi net bir istekle gelirse oyalamadan elindeki
  bilgiyle (aşağıdaki gardırop/hava/etkinlik context'i) makul bir öneri sun; sadece kritik bir bilgi
  gerçekten eksikse (örn. etkinlik tipi belirsizse) önce onu sor.
- Bu sohbetin geçmişini hatırlıyorsun (aşağıda verilir) ama BAŞKA bir sohbeti hatırlamıyorsun —
  kullanıcı önceki bir konuşmaya atıfta bulunur ve o bilgi bu geçmişte yoksa, uydurma; nazikçe
  hatırlamadığını belli et.

## Gardırop kullanımı
{wardrobe}

Yukarıdaki, verilmişse, sadece bir REFERANS'tır — seni bağlayan bir kısıt değil. Önceliğin her
zaman {name}'e o an için gerçekten en iyi stil önerisini sunmak; bunun için gardıropla sınırlı
kalman GEREKMİYOR, genel moda bilgini serbestçe kullan.

{weather_section}
{events_section}

## Kombin önerirken — VARSAYILAN davranışın zengin, serbest metinli öneridir
Aksi açıkça istenmedikçe (aşağıya bak) HER ZAMAN şu şekilde yanıtla: `outfit_items` ve
`outfit_explanation`'ı boş (null) bırak, tüm içeriği `message` alanına yaz:
- Tek bir kombinle yetinme, duruma uygun en az 3-4 farklı stil alternatifi sun (uygun olanları seç:
  klasik ve rahat, spor-şık, minimal, yazlık ve ferah, günlük casual, smart casual, sokak stili,
  ofis şıklığı gibi kategorilerden).
- Bu parçalar genel moda bilginden, TAMAMEN YENİ ve YARATICI olsun. {name}'in gardırobundaki gerçek
  parçaları (yukarıdaki listedeki renk/kategori/marka kombinasyonlarını) burada birebir tarif etme
  veya "aslında dolabındakiler de iş görür" diye geri dönme — {name} senden spesifik olarak yeni
  fikirler istiyor, aynı şeyleri başka kelimelerle tekrar etme.
- Her alternatif için: kısa bir başlık, parça listesi (üst, alt, ayakkabı + uygunsa çanta, takı,
  kemer, saat, gözlük, saç stili gibi tamamlayıcılar), ve hangi ortam/durum için uygun olduğunu
  belirten kısa bir açıklama satırı (başına 👉 koyabilirsin).
- Parçaları sadece isimle geçme — kumaş, renk, kesim ve parçaların birbiriyle uyumunu da kısaca
  belirt (örn. "oversize beyaz pamuklu tişört", "bej keten pantolon").
- `message` düz metin olarak gösteriliyor (markdown render edilmiyor): kalın/italik için yıldız
  işareti (**metin**) KULLANMA; madde işareti için SADECE "•" kullan (başka işaret kullanma), satır sonlarıyla böl, tek
  paragrafa sıkıştırma.
- Basit sohbet/small-talk turlarında (henüz kombin önerecek aşamada değilsen) bu formatı zorlama,
  `message`'a kısa doğal bir yanıt yaz yeterli.
- Alternatifleri verdikten sonra, uygunsa sona kısa bir soruyla "gardırobundan da bir örnek görmek
  ister misin?" gibi doğal bir teklif ekleyebilirsin — {name} buna "evet"/"göster" gibi kısa bir
  onayla dönerse bunu "gardırobumdan göster" isteği olarak yorumla.

## İSTİSNA: {name} açıkça "gardırobumdan", "dolabımdaki parçalarla", "üzerimdekilerle" gibi somut
bir şekilde KENDİ kıyafetlerinden bir kombin isterse, o zaman TAM TERSİNİ yap: gardıroptan seçtiğin
parçaları `outfit_items` alanına `item_id` + kısa bir `role` etiketiyle ("üst", "alt", "ayakkabı",
"dış giyim", "çanta", "aksesuar") doldur, `outfit_explanation`'a neden bu kombini seçtiğini kısaca
yaz. `message` alanına da kısa bir sunum cümlesi yeterli. Bu SADECE {name} bunu açıkça istediğinde
geçerli — varsayılan davranış değil.

Örnek — {name} "Bugün rahat bir şey giymek istiyorum" derse (özel bir istek olmasa bile, çünkü
varsayılan davranış budur), `message` alanına (outfit_items/outfit_explanation boş) şuna benzer bir
şey yazarsın — bu SADECE FORMAT örneği, gerçek yanıtta hava/etkinlik bağlamına göre farklı parçalar
ve alternatifler seç:

1. Klasik ve Rahat
• Oversize beyaz pamuklu tişört
• Mavi mom jean
• Beyaz deri sneaker
• Küçük omuz çantası
👉 Arkadaş buluşmaları ve günlük geziler için rahat ve şık.

2. Yazlık ve Ferah
• Bej keten pantolon
• Basic siyah tişört
• Deri sandalet
• Hasır çanta
👉 Sıcak havalarda hem konforlu hem modern görünür.

3. Spor-Şık
• Siyah tayt
• Oversize hoodie
• Beyaz sneaker
• Spor sırt çantası
👉 Gün boyu hareketliysen ideal bir tercih.

## Ton ve uzunluk
- Sıradan sohbet mesajlarında (small talk, tek soru) 1-3 cümle yeter, madde madde yazma.
- Zengin stil önerisi (B) verirken uzun ve yapılandırılmış yazman normaldir — kısa başlıklar ve
  madde imleri kullan, ama gereksiz doldurma yapma.
- {name} kombin/stil önerisiyle ilgili bir şey istediğinde ASLA "senin için bir kombin
  oluşturdum" gibi içeriksiz bir cümleyle geçiştirme — her seferinde somut, dolu bir öneri ver
  (yukarıdaki B formatı). Mesaj belirsiz/tuhaf gelse bile en makul yorumla devam et ve gerçek bir
  içerik üret, boş bir onay cümlesiyle bırakma.
- Emoji kullanabilirsin ama sıradan sohbette cimri kullan.
- Adını ara sıra kullan, her mesajda değil.
- Günlük hayat, ruh hali, plan gibi sohbetler senin doğal alanın — bunlardan kaçma. Ama konudan
  tamamen kopan, uygunsuz veya uzmanlık alanının çok dışında (tıbbi/hukuki/finansal tavsiye gibi)
  bir istek gelirse kibarca stil danışmanı kimliğine geri dön."""


class SuggestedOutfitItem(BaseModel):
    item_id: int
    role: str


class ChatReply(BaseModel):
    message: str
    outfit_items: list[SuggestedOutfitItem] | None = None
    outfit_explanation: str | None = None


class _MessageOnlyReply(BaseModel):
    message: str


def _build_system_prompt(name: str, wardrobe_context: str, weather_context: str | None, events_context: str) -> str:
    weather_section = (
        f"Güncel hava durumu: {weather_context}"
        if weather_context
        else "Güncel hava durumu bilgisi mevcut değil, dikkate alma."
    )
    events_section = (
        f"Yaklaşan etkinlikler: {events_context}" if events_context else "Yaklaşan planlanmış bir etkinlik yok."
    )
    return _SYSTEM_PROMPT_TEMPLATE.format(
        name=name, wardrobe=wardrobe_context, weather_section=weather_section, events_section=events_section
    )


_CREATIVE_MODE_WARDROBE_NOTE = (
    "(Bu turda gerçek gardırop parçalarının detayları bilerek verilmedi — amaç tamamen genel moda "
    "bilgine dayalı, yeni ve yaratıcı öneriler üretmen. Kullanıcının zaten kıyafetleri olduğunu "
    "biliyorsun ama bu yanıtta onları tarif etme veya yeniden önerme, sadece yeni fikirler sun.)"
)


_WARDROBE_ONLY_SIGNALS = (
    # Turkish suffixes attach directly to the stem (gardirobum-dan/-daki/-u/-la/...), so
    # matching the bare stem catches the grammatical variations in one go instead of
    # enumerating every possible suffix.
    "gardirobum",
    "dolabim",
    "elimdeki",
    "uzerimdeki",
    "sahip oldugum",
)

# "gardirobumdan BAŞKA ne olabilir" (other than my wardrobe) contains "gardirobumdan" but means
# the opposite of "gardirobumdan bir şey öner" — these markers next to a signal above flip it.
_WARDROBE_ONLY_NEGATORS = ("baska", "degil", "haric", "disinda", "olmayan", "yok")


def _normalize_tr(text: str) -> str:
    for src, dst in {"ı": "i", "İ": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c"}.items():
        text = text.replace(src, dst)
    return text.lower()


_SHORT_AFFIRMATIVE_REPLIES = ("evet", "olur", "tabii", "goster", "isterim", "lutfen", "tamam", "olsun")

# Loose stems (no possessive-person suffix) just to detect the ASSISTANT's own message talked
# about the wardrobe at all — e.g. "gardırobu-ndan" (your wardrobe, 2nd person, in its own
# offer) vs. "gardırobu-mdan" (my wardrobe, 1st person, in the USER's request) share this prefix.
_WARDROBE_MENTION_STEMS = ("gardirob", "dolab")


def _wants_wardrobe_only(message: str, history: list[tuple[str, str]] = ()) -> bool:
    """Keyword-detects an EXPLICIT request to use the real wardrobe. This is deliberately
    the narrower, rarer signal to detect (a handful of concrete phrasings) rather than
    trying to catch every possible way of saying "don't use my wardrobe" — natural language
    rejection phrasing is open-ended and kept slipping through, so the reliable fix is to
    default to the free-form/creative schema and only opt IN to the wardrobe-bound one here.

    Also catches a short affirmative ("evet", "göster") replying to the assistant's own
    "gardırobundan da görmek ister misin?" offer (see system prompt) — the message alone
    wouldn't contain a wardrobe keyword in that case, so the previous turn is checked too."""
    normalized = _normalize_tr(message)
    if any(signal in normalized for signal in _WARDROBE_ONLY_SIGNALS):
        return not any(negator in normalized for negator in _WARDROBE_ONLY_NEGATORS)

    if history and history[-1][0] == "assistant":
        previous_normalized = _normalize_tr(history[-1][1])
        offered_wardrobe = any(stem in previous_normalized for stem in _WARDROBE_MENTION_STEMS)
        is_short_reply = len(normalized.split()) <= 4
        if offered_wardrobe and is_short_reply and any(word in normalized for word in _SHORT_AFFIRMATIVE_REPLIES):
            return True

    return False


_NUMBERED_HEADER_RE = re.compile(r"(?<!\n)(?<!^)(\d+\.\s)")
_BULLET_RE = re.compile(r"(?<!\n)•\s")
_ARROW_RE = re.compile(r"(?<!\n)👉")


def _ensure_readable_line_breaks(text: str) -> str:
    """The model reliably follows the bullet/numbering/👉 formatting instructions but not
    the "put each on its own line" one — response_schema JSON string output seems biased
    toward single-line strings even when explicitly told to include newlines. Rather than
    keep stacking prompt wording (see project memory: that pattern hasn't worked for this
    model), force the line breaks in code after the fact."""
    text = _NUMBERED_HEADER_RE.sub(r"\n\n\1", text)
    text = _BULLET_RE.sub(lambda m: "\n" + m.group(0), text)
    text = _ARROW_RE.sub("\n👉", text)
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines).strip()


def _generate(system_prompt: str, contents: list[types.Content], schema: type[BaseModel] = ChatReply) -> BaseModel:
    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )

    parsed = response.parsed
    if not isinstance(parsed, schema):
        raise ValueError("Gemini yanıtı beklenen şemaya uymuyor")

    return parsed


def get_chat_reply(
    user_first_name: str,
    wardrobe_context: str,
    weather_context: str | None,
    events_context: str,
    history: list[tuple[str, str]],
    new_message: str,
) -> ChatReply:
    """history: list of (role, content) where role is 'user' or 'assistant', oldest first."""
    contents = [
        types.Content(role="user" if role == "user" else "model", parts=[types.Part.from_text(text=content)])
        for role, content in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=new_message)]))

    if _wants_wardrobe_only(new_message, history):
        # Explicit "use my real wardrobe" request — the only case that gets the real
        # wardrobe details AND the schema with outfit_items, so a real photo-backed
        # outfit card can be shown.
        system_prompt = _build_system_prompt(user_first_name, wardrobe_context, weather_context, events_context)
        reply = _generate(system_prompt, contents, schema=ChatReply)
        reply.message = _ensure_readable_line_breaks(reply.message)
        return reply

    # Default: creative/general-knowledge suggestions. Two enforcements, not one, because
    # instructions alone weren't reliable (see project memory for the failed prompt-only
    # attempts): (1) a response schema with no outfit_items field, so a structured
    # wardrobe-bound answer is impossible, and (2) the real wardrobe item details are left
    # OUT of this prompt entirely — a schema swap alone still let the model describe the
    # user's actual clothes by name in free text, which defeats the point just as much as
    # the photo card did. Without the real details in context, it can't do that.
    system_prompt = _build_system_prompt(user_first_name, _CREATIVE_MODE_WARDROBE_NOTE, weather_context, events_context)
    reply = _generate(system_prompt, contents, schema=_MessageOnlyReply)
    return ChatReply(message=_ensure_readable_line_breaks(reply.message))


def get_opening_message(user_first_name: str, wardrobe_context: str) -> str:
    """Generates the first assistant message of a brand-new conversation — no user
    message exists yet, so the model is nudged to open the small talk itself instead
    of leading with an outfit suggestion (see system prompt's "Sohbet akışı" section)."""
    cue = types.Content(
        role="user",
        parts=[
            types.Part.from_text(text="[SOHBET YENİ AÇILDI. Kullanıcıdan henüz bir mesaj gelmedi — ilk sözü sen al.]")
        ],
    )
    system_prompt = _build_system_prompt(user_first_name, wardrobe_context, weather_context=None, events_context="")
    return _ensure_readable_line_breaks(_generate(system_prompt, [cue]).message)
