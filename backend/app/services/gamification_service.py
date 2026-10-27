"""
Gamification Service
Manages candidate achievements, level badges, and daily challenges.
"""
from typing import List, Dict, Any
from app.repositories.gamification_repository import GamificationRepository

ALL_ACHIEVEMENTS = [
    {
        "key": "first_interview_complete",
        "title": "First Step to Mastery",
        "description": "Completed your first full PrepPulse interview session",
        "category": "Milestone",
        "xp_reward": 200,
        "icon": "military_tech"
    },
    {
        "key": "streak_3_days",
        "title": "Consistency Catalyst",
        "description": "Maintained an active interview preparation streak for 3 consecutive days",
        "category": "Streak",
        "xp_reward": 300,
        "icon": "local_fire_department"
    },
    {
        "key": "high_accuracy_90",
        "title": "Staff Engineer Caliber",
        "description": "Scored 90% or above on technical accuracy in an architectural session",
        "category": "Excellence",
        "xp_reward": 500,
        "icon": "verified"
    },
    {
        "key": "concurrency_specialist",
        "title": "Concurrency Virtuoso",
        "description": "Successfully answered 5 Concurrency & Memory Model questions",
        "category": "Topic",
        "xp_reward": 400,
        "icon": "terminal"
    },
    {
        "key": "speedy_synthesizer",
        "title": "Rapid Synthesizer",
        "description": "Submitted a comprehensive architectural response within 8 minutes",
        "category": "Pacing",
        "xp_reward": 250,
        "icon": "timer"
    }
]


class GamificationService:
    def __init__(self, db):
        self.gamification_repo = GamificationRepository(db)

    async def get_achievements_overview(self, user_id: str) -> Dict[str, Any]:
        """Returns all system achievements with the candidate's unlocked status."""
        user_unlocked = await self.gamification_repo.get_user_achievements(user_id)
        unlocked_keys = {u["achievement_key"]: u.get("earned_at") for u in user_unlocked}

        achievements_list = []
        for ach in ALL_ACHIEVEMENTS:
            is_unlocked = ach["key"] in unlocked_keys
            achievements_list.append({
                "key": ach["key"],
                "title": ach["title"],
                "description": ach["description"],
                "category": ach["category"],
                "xp_reward": ach["xp_reward"],
                "icon": ach["icon"],
                "unlocked": is_unlocked,
                "earned_at": unlocked_keys.get(ach["key"]) if is_unlocked else None
            })

        total_xp = await self.gamification_repo.get_total_xp(user_id)
        streak_days = await self.gamification_repo.get_streak_days(user_id)
        level = max(1, (total_xp // 500) + 1)
        next_level_xp = level * 500
        current_level_base = (level - 1) * 500
        progress_pct = round(((total_xp - current_level_base) / 500) * 100, 1)

        return {
            "total_xp": total_xp,
            "level": level,
            "next_level_xp": next_level_xp,
            "level_progress_percentage": min(100.0, max(0.0, progress_pct)),
            "streak_days": streak_days,
            "achievements": achievements_list
        }
