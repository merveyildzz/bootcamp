from fastapi import HTTPException, status


class AppError(Exception):
    """Base for app-level domain errors; feature services raise these instead of
    importing FastAPI/HTTPException directly, keeping business logic framework-agnostic."""

    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Bir hata oluştu"

    def __init__(self, detail: str | None = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)

    def to_http_exception(self) -> HTTPException:
        return HTTPException(status_code=self.status_code, detail=self.detail)


class EmailAlreadyRegisteredError(AppError):
    status_code = status.HTTP_409_CONFLICT
    detail = "Bu e-posta adresi zaten kayıtlı"


class InvalidCredentialsError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "E-posta veya şifre hatalı"


class InvalidRefreshTokenError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Oturum süresi doldu, lütfen tekrar giriş yapın"


class InvalidImageError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Geçersiz veya bozuk bir görsel dosyası"


class FileTooLargeError(AppError):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    detail = "Dosya boyutu çok büyük"


class StagingTokenNotFoundError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Yüklenen fotoğrafın süresi doldu, lütfen tekrar yükleyin"


class ClothingItemNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Kıyafet bulunamadı"


class InvalidWeatherRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Konum koordinatları (lat, lon) veya bir şehir adı belirtilmeli"


class CityNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Şehir bulunamadı"


class WeatherServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "Hava durumu servisine şu anda ulaşılamıyor"


class ConversationNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Sohbet bulunamadı"


class ChatServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "AI şu anda yanıt veremiyor, lütfen daha sonra tekrar deneyin"
