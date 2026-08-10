from fastapi import HTTPException, status


class NotAuthenticatedError(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated with Spotify")


class LLMQuotaExceededError(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Free quota expired")
