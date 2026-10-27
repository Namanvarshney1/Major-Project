"""
PrepPulse Async MongoDB Database Client
Supports production MongoDB / MongoDB Atlas, with graceful in-memory mock fallback
for friction-free offline execution and unit testing.
"""
from typing import Optional
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.core.config import settings
from app.core.logging import logger


class DatabaseManager:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db = None
    is_mock: bool = False

    async def connect_to_database(self, force_mock: bool = False):
        """Connects to MongoDB or initializes an in-memory mock if unreachable."""
        if force_mock:
            self._init_mock()
            return

        try:
            logger.info(f"Connecting to MongoDB at: {settings.MONGODB_URI}...")
            client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                uuidRepresentation="standard"
            )
            # Test connection with ping
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.MONGODB_DATABASE]
            self.is_mock = False
            logger.info(f"Successfully connected to MongoDB database '{settings.MONGODB_DATABASE}'.")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            logger.warning(
                f"Could not connect to live MongoDB at {settings.MONGODB_URI} ({exc}). "
                f"Falling back to high-fidelity AsyncMongoMock for in-memory session persistence."
            )
            self._init_mock()

    def _init_mock(self):
        """Initializes mongomock-motor for in-memory mock execution."""
        from mongomock_motor import AsyncMongoMockClient
        self.client = AsyncMongoMockClient()
        self.db = self.client[settings.MONGODB_DATABASE]
        self.is_mock = True
        logger.info(f"Async in-memory MongoDB initialized for database '{settings.MONGODB_DATABASE}'.")

    async def close_database_connection(self):
        """Closes MongoDB connection pool."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    def get_database(self):
        """Returns the active MongoDB database handle."""
        return self.db


db_manager = DatabaseManager()


async def get_db():
    """FastAPI dependency for accessing the database."""
    return db_manager.get_database()
