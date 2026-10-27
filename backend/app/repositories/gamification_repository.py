"""
Gamification and Practice Activity MongoDB Repository
Tracks candidate XP, streaks, level thresholds, and unlocked badges.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any


class GamificationRepository:
    def __init__(self, db):
        self.achievements_coll = db.achievements
        self.activity_coll = db.practice_activity

    async def log_activity(
        self,
        user_id: str,
        activity_type: str,
        topic: str,
        xp_awarded: int
    ) -> Dict[str, Any]:
        doc = {
            "user_id": user_id,
            "activity_type": activity_type,
            "topic": topic,
            "xp_awarded": xp_awarded,
            "created_at": datetime.now(timezone.utc)
        }
        res = await self.activity_coll.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        return doc

    async def get_total_xp(self, user_id: str) -> int:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total": {"$sum": "$xp_awarded"}}}
        ]
        cursor = self.activity_coll.aggregate(pipeline)
        docs = await cursor.to_list(length=1)
        if docs:
            return int(docs[0].get("total", 0))
        return 0

    async def get_streak_days(self, user_id: str) -> int:
        """Calculates consecutive days of activity ending today or yesterday."""
        cursor = self.activity_coll.find(
            {"user_id": user_id},
            {"created_at": 1}
        ).sort("created_at", -1)
        activities = await cursor.to_list(length=500)
        if not activities:
            return 1  # 1-day initial grace on new account

        unique_dates = sorted(list({
            act["created_at"].date() if isinstance(act["created_at"], datetime)
            else datetime.fromisoformat(str(act["created_at"])).date()
            for act in activities if "created_at" in act
        }), reverse=True)

        if not unique_dates:
            return 1

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        # Check if active today or yesterday
        if unique_dates[0] not in (today, yesterday):
            return 0

        streak = 1
        for i in range(len(unique_dates) - 1):
            if unique_dates[i] - unique_dates[i + 1] == timedelta(days=1):
                streak += 1
            else:
                break
        return streak

    async def unlock_achievement(
        self,
        user_id: str,
        achievement_key: str,
        title: str,
        description: str,
        category: str = "Milestone",
        xp_reward: int = 100
    ) -> bool:
        doc = {
            "user_id": user_id,
            "achievement_key": achievement_key,
            "title": title,
            "description": description,
            "category": category,
            "xp_reward": xp_reward,
            "earned_at": datetime.now(timezone.utc)
        }
        try:
            await self.achievements_coll.update_one(
                {"user_id": user_id, "achievement_key": achievement_key},
                {"$setOnInsert": doc},
                upsert=True
            )
            return True
        except Exception:
            return False

    async def get_user_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.achievements_coll.find({"user_id": user_id})
        docs = await cursor.to_list(length=100)
        for d in docs:
            d["id"] = str(d["_id"])
        return docs

    async def delete_all_for_user(self, user_id: str) -> int:
        r1 = await self.achievements_coll.delete_many({"user_id": user_id})
        r2 = await self.activity_coll.delete_many({"user_id": user_id})
        return r1.deleted_count + r2.deleted_count
