"""
PrepPulse MongoDB Index Creation Module
Ensures explicit indexes for low-latency queries and integrity constraints.
"""
from pymongo import ASCENDING, DESCENDING
from app.core.logging import logger


async def create_db_indexes(db):
    """Creates indexes across all core collections."""
    try:
        # Users collection
        await db.users.create_index([("email", ASCENDING)], unique=True)

        # Interviews collection: user_id + created_at
        await db.interviews.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.interviews.create_index([("status", ASCENDING)])

        # Questions collection: interview_id + order
        await db.questions.create_index([("interview_id", ASCENDING), ("order", ASCENDING)])
        await db.questions.create_index([("user_id", ASCENDING)])

        # Answers collection: compound uniqueness to prevent duplicates
        await db.answers.create_index(
            [("interview_id", ASCENDING), ("question_id", ASCENDING)],
            unique=True
        )
        await db.answers.create_index([("user_id", ASCENDING)])

        # Evaluations collection
        await db.evaluations.create_index([("interview_id", ASCENDING), ("question_id", ASCENDING)])
        await db.evaluations.create_index([("user_id", ASCENDING)])

        # Achievements collection: compound user + achievement_key unique
        await db.achievements.create_index(
            [("user_id", ASCENDING), ("achievement_key", ASCENDING)],
            unique=True
        )

        # Practice Activity collection
        await db.practice_activity.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

        logger.info("MongoDB indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Notice during index creation: {e}")
