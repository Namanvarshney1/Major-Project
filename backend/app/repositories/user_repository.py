"""
User MongoDB Repository
Provides scoped user CRUD operations with ObjectId validation.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId


class UserRepository:
    def __init__(self, db):
        self.collection = db.users

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"email": email.lower().strip()})
        return self._format_doc(user)

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(user_id)
        except (InvalidId, TypeError):
            return None
        user = await self.collection.find_one({"_id": oid})
        return self._format_doc(user)

    async def create(self, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        user_dict["email"] = user_dict["email"].lower().strip()
        user_dict["created_at"] = now
        user_dict["updated_at"] = now
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return self._format_doc(user_dict)

    async def update(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            oid = ObjectId(user_id)
        except (InvalidId, TypeError):
            return None
        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.collection.update_one({"_id": oid}, {"$set": update_data})
        return await self.get_by_id(user_id)

    async def delete(self, user_id: str) -> bool:
        try:
            oid = ObjectId(user_id)
        except (InvalidId, TypeError):
            return False
        result = await self.collection.delete_one({"_id": oid})
        return result.deleted_count > 0

    def _format_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        d = dict(doc)
        if "_id" in d:
            d["id"] = str(d["_id"])
            del d["_id"]
        return d
