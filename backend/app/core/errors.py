"""
PrepPulse Application Exceptions & Error Handlers
Defines domain-specific exceptions and uniform error responses.
"""
from fastapi import HTTPException, status


class PrepPulseException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(PrepPulseException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found"
        )


class UnauthorizedException(PrepPulseException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class ForbiddenException(PrepPulseException):
    def __init__(self, detail: str = "Access forbidden to requested resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class DuplicateSubmissionException(PrepPulseException):
    def __init__(self, detail: str = "Answer has already been submitted for this question"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class AIProviderException(PrepPulseException):
    def __init__(self, detail: str = "AI inference provider encountered an error"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail
        )
