import logging
import re
import sys
from typing import Any

# Masking patterns for sensitive fields
SENSITIVE_PATTERNS = [
    (re.compile(r'("password"|"token"|"secret"|"hashed_password"):\s*"[^"]*"', re.IGNORECASE), r'\1: "***"'),
    (re.compile(r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', re.IGNORECASE), r'\1***'),
]


class SanitizedFormatter(logging.Formatter):
    """Sanitizes sensitive information such as passwords, tokens, and secrets from logs."""

    def format(self, record: logging.LogRecord) -> str:
        formatted = super().format(record)
        for pattern, replacement in SENSITIVE_PATTERNS:
            formatted = pattern.sub(replacement, formatted)
        return formatted


def setup_logging(level: int = logging.INFO) -> None:
    """Configures application-wide secure logging."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = SanitizedFormatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]


def get_logger(name: str) -> logging.Logger:
    """Returns a logger instance with the given name."""
    return logging.getLogger(name)
