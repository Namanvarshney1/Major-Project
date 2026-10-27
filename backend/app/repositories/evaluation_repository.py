"""
Evaluation MongoDB Repository
Persists structured AI evaluations and queries aggregated performance.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId


class EvaluationRepository:
    def __init__(self, db):
        self.collection = db.evaluations

    async def create(self, eval_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        eval_dict["created_at"] = now
        result = await self.collection.insert_one(eval_dict)
        eval_dict["_id"] = result.inserted_id
        return self._format_doc(eval_dict)

    async def get_by_question_id(self, question_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query: Dict[str, Any] = {"question_id": question_id}
        if user_id:
            query["user_id"] = user_id
        doc = await self.collection.find_one(query)
        return self._format_doc(doc)

    async def list_by_interview(self, interview_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"interview_id": interview_id}
        if user_id:
            query["user_id"] = user_id
        cursor = self.collection.find(query).sort("created_at", 1)
        docs = await cursor.to_list(length=100)
        return [self._format_doc(d) for d in docs]

    async def list_recent_by_user(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._format_doc(d) for d in docs]

    async def get_all_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", 1)
        docs = await cursor.to_list(length=1000)
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
