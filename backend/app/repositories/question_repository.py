"""
Question MongoDB Repository
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId


class QuestionRepository:
    def __init__(self, db):
        self.collection = db.questions

    async def create(self, question_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        question_dict["created_at"] = now
        result = await self.collection.insert_one(question_dict)
        question_dict["_id"] = result.inserted_id
        return self._format_doc(question_dict)

    async def get_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(question_id)
        except (InvalidId, TypeError):
            return None
        doc = await self.collection.find_one({"_id": oid})
        return self._format_doc(doc)

    async def get_by_interview_and_order(self, interview_id: str, order: int) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({
            "interview_id": interview_id,
            "order": order
        })
        return self._format_doc(doc)

    async def list_by_interview(self, interview_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"interview_id": interview_id}).sort("order", 1)
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
