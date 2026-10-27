"""
Session History API Endpoints
Provides filtered and paginated interview performance records.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from app.db.mongodb import get_db
from app.api.dependencies import get_current_user
from app.repositories.interview_repository import InterviewRepository

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/", response_model=Dict[str, Any])
async def list_interview_history(
    status: Optional[str] = Query(None, description="in_progress, completed"),
    difficulty: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_db)
):
    repo = InterviewRepository(db)
    sessions = await repo.list_by_user(current_user["id"], status=status, limit=limit, skip=skip)
    
    # Filter by optional criteria in memory if provided
    filtered = []
    for s in sessions:
        if difficulty and s.get("difficulty") != difficulty:
            continue
        if role and role.lower() not in s.get("job_role", "").lower():
            continue
        filtered.append(s)

    total_count = await repo.count_by_user(current_user["id"], status=status)
    return {
        "total": total_count,
        "items": filtered,
        "limit": limit,
        "skip": skip
    }
