"""
Analytics, AI Coach, Interview DNA, Skill Tree, and Gamification Schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DashboardMetricsResponse(BaseModel):
    user_name: str
    target_role: str
    target_level: str
    streak_days: int
    interviews_completed: int
    average_score: float
    improving_competency: str
    improving_delta: str
    weakest_anchor: str
    active_session: Optional[Dict[str, Any]] = None
    ai_coach_prescription: Dict[str, Any]
    recent_evaluations: List[Dict[str, Any]]
    velocity_chart: List[Dict[str, Any]]
    total_xp: int
    level: int


class InterviewDnaResponse(BaseModel):
    overall_readiness: float
    cohort_percentile: int
    dimension_scores: Dict[str, float]
    topic_breakdown: List[Dict[str, Any]]
    strengths_summary: List[str]
    growth_areas: List[str]


class SkillTreeNode(BaseModel):
    id: str
    name: str
    category: str
    status: str  # not_started, practising, proficient
    score: float
    completed_sessions: int
    prerequisites: List[str] = []


class SkillTreeResponse(BaseModel):
    track_name: str
    overall_progress: float
    nodes: List[SkillTreeNode]


class AchievementResponse(BaseModel):
    key: str
    title: str
    description: str
    category: str
    xp_reward: int
    unlocked: bool
    earned_at: Optional[datetime] = None


class CoachPrescriptionResponse(BaseModel):
    ref_id: str
    title: str
    description: str
    impact: str  # "High Impact", "Medium", "Critical"
    estimated_minutes: int
    scenarios_count: int
    projected_mastery_gain: str
    recommended_topics: List[str]
    rationale: str
    history_based: bool
