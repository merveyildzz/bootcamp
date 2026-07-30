from google import genai
from google.genai import types

from app.core.config import settings
from app.features.wardrobe.schemas import DetectedAttributes
from app.features.wardrobe.taxonomy import TAXONOMY

_PROMPT_TEMPLATE = """Bu görseldeki tek bir kıyafet parçasını analiz et.

Aşağıdaki her alan için SADECE verilen listeden bir değer seç. Görselden emin
olamadığın veya listede uygun bir değer olmadığı bir alanı boş (null) bırak.
Kesinlikle listede olmayan bir değer üretme.

Kategori seçenekleri: {category}
Renk seçenekleri: {color}
Stil seçenekleri: {style}
Mevsim seçenekleri: {season}

Kumaş alanı için (kısıtlı bir liste yok): görselden tahmin edebiliyorsan kısa bir
kelime yaz (örn. "pamuk", "deri", "kot", "yün"); emin değilsen boş bırak.
"""


def _build_prompt() -> str:
    return _PROMPT_TEMPLATE.format(
        category=", ".join(TAXONOMY["category"]),
        color=", ".join(TAXONOMY["color"]),
        style=", ".join(TAXONOMY["style"]),
        season=", ".join(TAXONOMY["season"]),
    )


def analyze_clothing_image(image_bytes: bytes, mime_type: str) -> DetectedAttributes:
    """Asks Gemini Vision to classify the photo into the app's fixed taxonomy.
    Any failure (missing/invalid API key, network error, malformed response) is the
    caller's responsibility to catch — a flaky AI call must never block the upload,
    it should just leave the review form empty for the user to fill in by hand."""
    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            _build_prompt(),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DetectedAttributes,
        ),
    )

    parsed = response.parsed
    if not isinstance(parsed, DetectedAttributes):
        raise ValueError("Gemini yanıtı beklenen şemaya uymuyor")

    return parsed
