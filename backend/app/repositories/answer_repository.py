"""
Answer MongoDB Repository
Implements candidate answer persistence, upserting for edits, and duplicate prevention.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId


class AnswerRepository:
    def __init__(self, db):
        self.collection = db.answers

    async def create(self, answer_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        answer_dict["submitted_at"] = now
        answer_dict["updated_at"] = now
        result = await self.collection.insert_one(answer_dict)
        answer_dict["_id"] = result.inserted_id
        return self._format_doc(answer_dict)

    async def upsert(
        self,
        question_id: str,
        interview_id: str,
        user_id: str,
        answer_text: str,
        time_spent_seconds: int = 0
    ) -> Dict[str, Any]:
        """Saves or updates candidate's answer for a question."""
        now = datetime.now(timezone.utc)
        query = {
            "question_id": question_id,
            "interview_id": interview_id,
            "user_id": user_id
        }
        update = {
            "$set": {
                "answer_text": answer_text,
                "time_spent_seconds": time_spent_seconds,
                "updated_at": now
            },
            "$setOnInsert": {
                "submitted_at": now,
                "question_id": question_id,
                "interview_id": interview_id,
                "user_id": user_id
            }
        }
        await self.collection.update_one(query, update, upsert=True)
        doc = await self.collection.find_one(query)
        return self._format_doc(doc)

    async def get_by_question_and_interview(
        self,
        question_id: str,
        interview_id: str,
        user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        query = {
            "question_id": question_id,
            "interview_id": interview_id
        }
        if user_id:
            query["user_id"] = user_id
        doc = await self.collection.find_one(query)
        return self._format_doc(doc)

    async def list_by_interview(self, interview_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"interview_id": interview_id}
        if user_id:
            query["user_id"] = user_id
        cursor = self.collection.find(query).sort("submitted_at", 1)
        docs = await cursor.to_list(length=100)
        return [self._format_doc(d) for d in docs]

    async def delete_all_for_user(self, user_id: str) -> int:
        result = await self.collection.delete_many({"user_id": user_id})
        return result.deleted_count

    def _format_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        d = dict(doc)
        if "_id" in d:
            d["id"] = str(d["_id"])
            del d["_id"]
        return d
