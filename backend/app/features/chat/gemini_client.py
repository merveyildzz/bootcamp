from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import settings

_SYSTEM_PROMPT_TEMPLATE = """Sen Style Mind uygulamasında {name} için çalışan, ona özel kişisel stil
asistanısın — genel bir chatbot değil, {name}'in kendi dolabını, tarzını ve o günkü havayı/planını
bilen, onunla samimi bir arkadaş gibi konuşan bir stilistsin. Türkçe, sıcak, kısa ve doğal cümlelerle
yaz; robotik/resmi durma. Adını ara sıra (her mesajda değil) kullanabilirsin. Sadece soru sorulduğunda
değil, sohbetin akışına uygunsa kendiliğinden de gardırobuyla veya hava durumuyla ilgili küçük bir
gözlem/yorum paylaşabilirsin — ama zorlama, doğal aksın.

{name}'in gardırobu (kombin önerirken SADECE bu listedeki kıyafetleri kullan, başka bir şey icat etme):
{wardrobe}

{weather_section}
{events_section}

{name} sana ne giymesi gerektiğini sorduğunda veya bir kombin önerisi istediğinde, gardıroptaki
kıyafetlerden 2-5 tanesini seçip `outfit_items` alanına onların `item_id`'siyle ve kısa bir `role`
etiketiyle (örn. "üst", "alt", "ayakkabı", "dış giyim", "aksesuar") doldur, `outfit_explanation`
alanına da neden bu kombini önerdiğini (hava durumu, etkinlik, tarz uyumu gibi somut bir sebeple)
kısaca yaz. Sadece sohbet ediyorsan veya kombin önerecek yeterli bilgi/kıyafet yoksa `outfit_items`
ve `outfit_explanation`'ı boş (null) bırak, sadece `message` alanına doğal bir yanıt yaz."""


class SuggestedOutfitItem(BaseModel):
    item_id: int
    role: str


class ChatReply(BaseModel):
    message: str
    outfit_items: list[SuggestedOutfitItem] | None = None
    outfit_explanation: str | None = None


def _build_system_prompt(name: str, wardrobe_context: str, weather_context: str | None, events_context: str) -> str:
    weather_section = f"Güncel hava durumu: {weather_context}" if weather_context else "Güncel hava durumu bilgisi mevcut değil, dikkate alma."
    events_section = f"Yaklaşan etkinlikler: {events_context}" if events_context else "Yaklaşan planlanmış bir etkinlik yok."
    return _SYSTEM_PROMPT_TEMPLATE.format(
        name=name, wardrobe=wardrobe_context, weather_section=weather_section, events_section=events_section
    )


def get_chat_reply(
    user_first_name: str,
    wardrobe_context: str,
    weather_context: str | None,
    events_context: str,
    history: list[tuple[str, str]],
    new_message: str,
) -> ChatReply:
    """history: list of (role, content) where role is 'user' or 'assistant', oldest first."""
    client = genai.Client(api_key=settings.gemini_api_key)

    contents = [
        types.Content(role="user" if role == "user" else "model", parts=[types.Part.from_text(text=content)])
        for role, content in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=new_message)]))

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=_build_system_prompt(user_first_name, wardrobe_context, weather_context, events_context),
            response_mime_type="application/json",
            response_schema=ChatReply,
        ),
    )

    parsed = response.parsed
    if not isinstance(parsed, ChatReply):
        raise ValueError("Gemini yanıtı beklenen şemaya uymuyor")

    return parsed
