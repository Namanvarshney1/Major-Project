"""
PrepPulse Structured Logging Configuration
Provides unified structured logging across all backend services without leaking secrets.
"""
import logging
import sys


def setup_logging():
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s:%(lineno)d | %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    # Reduce chatty third-party loggers
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


logger = logging.getLogger("preppulse")
