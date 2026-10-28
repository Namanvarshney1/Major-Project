"""
PrepPulse Async MongoDB Database Client
Supports production MongoDB / MongoDB Atlas with explicit diagnostics and configurable offline mock.
"""
from typing import Optional
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure, ConfigurationError

from app.core.config import settings, mask_mongo_uri
from app.core.logging import logger


class DatabaseManager:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db = None
    is_mock: bool = False
    connection_error: Optional[str] = None

    async def connect_to_database(self, force_mock: bool = False):
        """
        Connects to the configured MongoDB database using MONGODB_URI and MONGODB_DATABASE.
        Verifies connectivity via an active ping command.
        
        If connection fails:
        - In production, raises RuntimeError (startup failure).
        - In development, only falls back to mock if ALLOW_MOCK_DB=True, logging clear warnings.
        """
        if force_mock or (self.is_mock and self.client is not None):
            if not self.client:
                self._init_mock()
            return

        masked_uri = mask_mongo_uri(settings.MONGODB_URI)
        try:
            logger.info(f"Connecting to MongoDB at: {masked_uri} (Database: '{settings.MONGODB_DATABASE}')...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
                uuidRepresentation="standard"
            )
            # Actively verify connectivity via non-destructive admin ping
            ping_res = await client.admin.command('ping')
            self.client = client
            self.db = client[settings.MONGODB_DATABASE]
            self.is_mock = False
            self.connection_error = None
            logger.info(f"Successfully connected to MongoDB database '{settings.MONGODB_DATABASE}' (ping: {ping_res}).")
        except (ConnectionFailure, ServerSelectionTimeoutError, OperationFailure, ConfigurationError, Exception) as exc:
            self.connection_error = str(exc)
            from app.db.health import check_mongodb_connection, print_health_check_report
            diag = await check_mongodb_connection(settings.MONGODB_URI, settings.MONGODB_DATABASE, timeout_ms=3000)

            logger.error(f"Failed to connect to live MongoDB at {masked_uri}: {exc}")
            if diag.get("cause"):
                logger.error(f"MongoDB Diagnosis: {diag['cause']}")
            if diag.get("fix_instructions"):
                logger.error(f"How to fix:\n{diag['fix_instructions']}")

            # In production or if mock mode is not explicitly enabled, fail fast
            if settings.ENVIRONMENT == "production" or not settings.ALLOW_MOCK_DB:
                raise RuntimeError(
                    f"Required database connection to {masked_uri} failed: {exc}.\n"
                    f"Diagnosis: {diag.get('cause', 'Unknown')}\n"
                    f"Fix: {diag.get('fix_instructions', 'Check Atlas IP Access List and credentials.')}"
                ) from exc

            # Otherwise development fallback is explicitly permitted
            logger.warning(
                f"ALLOW_MOCK_DB is enabled. Falling back to in-memory AsyncMongoMock for development. "
                f"NOTICE: Session history and accounts will NOT persist across server reboots in mock mode!"
            )
            self._init_mock()

    def _init_mock(self):
        """Initializes mongomock-motor for explicit offline testing."""
        from mongomock_motor import AsyncMongoMockClient
        self.client = AsyncMongoMockClient()
        self.db = self.client[settings.MONGODB_DATABASE]
        self.is_mock = True
        logger.info(f"Async in-memory MongoDB initialized for database '{settings.MONGODB_DATABASE}' (Mock Mode).")

    async def close_database_connection(self):
        """Closes MongoDB connection pool cleanly during application shutdown."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed cleanly.")

    def get_database(self):
        """Returns the active MongoDB database handle."""
        return self.db

    def is_connected_to_real_db(self) -> bool:
        """Returns True if connected to real MongoDB instance, False if mock or disconnected."""
        return self.client is not None and not self.is_mock


db_manager = DatabaseManager()


async def get_db():
    """FastAPI dependency for accessing the database."""
    return db_manager.get_database()
