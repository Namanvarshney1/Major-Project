"""
Interview MongoDB Repository
Provides scoped interview persistence and session queries.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId


class InterviewRepository:
    def __init__(self, db):
        self.collection = db.interviews

    async def create(self, interview_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        interview_dict["created_at"] = now
        interview_dict["current_question_index"] = 0
        interview_dict["status"] = "in_progress"
        interview_dict["final_score"] = None
        result = await self.collection.insert_one(interview_dict)
        interview_dict["_id"] = result.inserted_id
        return self._format_doc(interview_dict)

    async def get_by_id(self, interview_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            query: Dict[str, Any] = {"_id": ObjectId(interview_id)}
        except (InvalidId, TypeError):
            return None
        if user_id:
            query["user_id"] = user_id
        doc = await self.collection.find_one(query)
        return self._format_doc(doc)

    async def get_active_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the latest in_progress interview session for the candidate."""
        doc = await self.collection.find_one(
            {"user_id": user_id, "status": "in_progress"},
            sort=[("created_at", -1)]
        )
        return self._format_doc(doc)

    async def list_by_user(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._format_doc(d) for d in docs]

    async def count_by_user(self, user_id: str, status: Optional[str] = None) -> int:
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        return await self.collection.count_documents(query)

    async def update(self, interview_id: str, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            query: Dict[str, Any] = {"_id": ObjectId(interview_id)}
        except (InvalidId, TypeError):
            return None
        if user_id:
            query["user_id"] = user_id
        await self.collection.update_one(query, {"$set": update_data})
        return await self.get_by_id(interview_id, user_id=user_id)

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
