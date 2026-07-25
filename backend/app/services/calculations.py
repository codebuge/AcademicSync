from typing import List, Optional, Any

# GPA-eligible mark statuses. `verified` marks are still inside an open
# semester; `locked` marks belong to a semester that SemesterGuard has
# closed out. Both must count toward GPA/CGPA — only `draft` and
# `pending_verification` marks are excluded.
GPA_ELIGIBLE_STATUSES = ("verified", "locked")

DEFAULT_CREDITS_PER_SEMESTER = 15.0


class ScoreOutOfRangeError(ValueError):
    """
    Raised when a score does not match any row in the grading scale.

    This is a genuine data problem (bad score, or a misconfigured/incomplete
    scale) and must never be conflated with a score that matched a row which
    is intentionally excluded from GPA (e.g. Incomplete/Withdrawn/Freeze
    bands with gpa_points = None). Callers should catch this explicitly
    rather than treating it the same as an excluded grade.
    """

    def __init__(self, score: float):
        self.score = score
        super().__init__(f"Score {score} does not match any row in the grading scale")


def score_to_gpa(score: float, scale_rows: List[Any]) -> Optional[float]:
    """
    Finds the GPA points for a given score based on the user's grading scale.

    Returns:
        - A float GPA value if the score matches a scored row.
        - None ONLY if the score matches a row that is intentionally excluded
          from GPA calculations (row.gpa_points is None by design, e.g. an
          Incomplete/Withdrawn/Freeze band).

    Raises:
        ScoreOutOfRangeError: if the score matches no row at all. This is a
          data/config problem, not an exclusion, and must not be silently
          swallowed as a None.
    """
    if not scale_rows:
        # Fallback to standard 4.0 scale if no rows are present.
        # This fallback scale covers 0-100 fully, so it never raises.
        if score >= 91: return 4.0
        elif score >= 80: return 3.66
        elif score >= 75: return 3.3
        elif score >= 71: return 3.0
        elif score >= 68: return 2.66
        elif score >= 64: return 2.33
        elif score >= 61: return 2.0
        elif score >= 58: return 1.66
        elif score >= 54: return 1.33
        elif score >= 50: return 1.0
        else: return 0.0

    matching_rows = [
        row for row in scale_rows
        if row.min_percent is not None
        and score >= row.min_percent
        and (row.max_percent is None or score <= row.max_percent)
    ]
    if not matching_rows:
        # No row covers this score at all — that's a data/config issue,
        # not an intentional exclusion. Never return None here.
        raise ScoreOutOfRangeError(score)

    # Return the row with the highest min_percent threshold
    best_row = max(matching_rows, key=lambda r: r.min_percent)
    # If gpa_points is None here, it's because THIS row was matched and is
    # explicitly marked as excluded (e.g. Incomplete/Withdrawn/Freeze band).
    return best_row.gpa_points


def calculate_private_gpa(
    marks: List[Any],
    scale_rows: List[Any] = None,
    strict: bool = True,
) -> float:
    """
    PRIVATE PATHWAY: Calculate semester GPA for authenticated users.

    Requires marks to have verified or locked status (GPA_ELIGIBLE_STATUSES).
    Excludes draft/pending marks and non-numeric grade exclusions (I/W/FRZ).
    """
    return calculate_gpa(marks, scale_rows, strict=strict)


def calculate_private_cgpa(
    all_marks: List[Any],
    scale_rows: List[Any] = None,
    strict: bool = True,
) -> float:
    """
    PRIVATE PATHWAY: Calculate cumulative CGPA for authenticated users.

    Requires marks to have verified or locked status (GPA_ELIGIBLE_STATUSES).
    Excludes draft/pending marks and non-numeric grade exclusions (I/W/FRZ).
    """
    return calculate_cgpa(all_marks, scale_rows, strict=strict)


def calculate_gpa(
    marks: List[Any],
    scale_rows: List[Any] = None,
    strict: bool = True,
) -> float:
    """
    Calculate GPA for a single semester.

    Includes 'verified' AND 'locked' marks (case-insensitive for
    compatibility) — locked marks belong to closed-out semesters and must
    still count toward GPA.

    Excludes marks whose grade is intentionally excluded from GPA
    (Incomplete/Withdrawn/Freeze), signaled by score_to_gpa returning None.
    """
    if scale_rows is None:
        scale_rows = []

    eligible_marks = []
    for m in marks:
        # Support both 'status' and old 'verification_status' fields
        status_val = getattr(m, "status", None) or getattr(m, "verification_status", None) or ""
        if status_val.lower() not in GPA_ELIGIBLE_STATUSES:
            continue

        try:
            gp = score_to_gpa(m.score, scale_rows)
        except ScoreOutOfRangeError:
            if strict:
                raise
            continue

        if gp is not None:
            eligible_marks.append((gp, m.credit_hours))

    if not eligible_marks:
        return 0.0

    total_points = sum(gp * credits for gp, credits in eligible_marks)
    total_credits = sum(credits for gp, credits in eligible_marks)

    if total_credits == 0:
        return 0.0

    return round(total_points / total_credits, 2)


def calculate_cgpa(all_marks: List[Any], scale_rows: List[Any] = None, strict: bool = True) -> float:
    """
    Calculate CGPA across all semesters.
    Includes 'verified' AND 'locked' marks. Excludes intentionally-excluded
    grade types (Incomplete/Withdrawn/Freeze).
    """
    return calculate_gpa(all_marks, scale_rows, strict=strict)


def get_cgpa_projection(
    target_cgpa: float,
    remaining_semesters: int,
    current_cgpa: float,
    completed_credits: float,
    scale_rows: List[Any] = None,
    remaining_credits: Optional[float] = None,
    credits_per_semester: float = DEFAULT_CREDITS_PER_SEMESTER,
) -> dict:
    """
    Calculate the required GPA in remaining semesters to achieve target CGPA.

    Args:
        remaining_credits: actual planned credit load for the remaining
            semesters (e.g. sum of `planned_courses.credit_hours`). If not
            supplied, falls back to `remaining_semesters * credits_per_semester`.
        credits_per_semester: only used as a fallback estimate when
            `remaining_credits` isn't provided — no longer hardcoded to 15.0.

    Returns a dict with:
        required_gpa: unrounded-precision GPA needed in remaining credits,
            rounded to 2 dp for display. None if there are no remaining
            credits to earn.
        achievable: whether required_gpa is reachable on the scale.
        already_exceeded: True if the target is already met or beaten with
            no further credits needed.
    """
    if remaining_credits is None:
        remaining_credits = remaining_semesters * credits_per_semester

    # Determine max GPA points from scale_rows (default to 4.0 if not available)
    max_gpa = 4.0
    if scale_rows:
        valid_points = [r.gpa_points for r in scale_rows if r.gpa_points is not None]
        if valid_points:
            max_gpa = max(valid_points)

    # No remaining credits to earn (e.g. graduating, or no more courses
    # planned) — achievability is just "did you already hit the target?"
    if remaining_semesters <= 0 or remaining_credits <= 0:
        already_exceeded = current_cgpa >= target_cgpa
        return {
            "required_gpa": None,
            "achievable": already_exceeded,
            "already_exceeded": already_exceeded,
        }

    total_credits = completed_credits + remaining_credits
    required_points = (target_cgpa * total_credits) - (current_cgpa * completed_credits)
    required_gpa_unrounded = required_points / remaining_credits

    # A negative required GPA means the target is already exceeded given
    # current standing — that's a success state, not "unachievable".
    already_exceeded = required_gpa_unrounded <= 0.0

    # Compare on the UNROUNDED value so a true 4.004 doesn't round down to
    # 4.0 and read as achievable when it technically isn't.
    achievable = already_exceeded or required_gpa_unrounded <= max_gpa

    # Round only for display — the achievability check above already used
    # the unrounded value, so a true 4.004 can't round down to a misleading
    # "achievable" 4.0.
    display_required_gpa = round(required_gpa_unrounded, 2)

    return {
        "required_gpa": display_required_gpa,
        "achievable": achievable,
        "already_exceeded": already_exceeded,
    }


def score_to_letter_grade_default(score: float) -> str:
    if score >= 91: return "A"
    elif score >= 80: return "A-"
    elif score >= 75: return "B+"
    elif score >= 71: return "B"
    elif score >= 68: return "B-"
    elif score >= 64: return "C+"
    elif score >= 61: return "C"
    elif score >= 58: return "C-"
    elif score >= 54: return "D+"
    elif score >= 50: return "D"
    else: return "F"


def _score_to_gpa_for_scale(score: float, grading_scale: str, scale_rows: List[Any]) -> Optional[float]:
    """
    Single source of truth for turning a score into GPA points under any
    supported grading_scale, honoring the institution's actual scale_rows
    instead of always defaulting to the built-in 4.0 fallback.

    Returns None when the grade is intentionally excluded (never fabricates
    a substitute value like 0.0/F for an excluded grade).
    Propagates ScoreOutOfRangeError for genuine out-of-range scores.
    """
    if grading_scale == "percentage":
        return score

    gp_4_0 = score_to_gpa(score, scale_rows)
    if gp_4_0 is None:
        # Intentionally excluded grade — do NOT substitute 0.0/F. Preserve
        # the exclusion signal all the way through.
        return None

    if grading_scale == "5.0":
        return round(gp_4_0 * 1.25, 2)

    # "4.0" or any unrecognized scale name falls back to the 4.0 value as-is
    return gp_4_0


def calculate_gpa_from_courses(
    courses: List[Any],
    grading_scale: str = "4.0",
    scale_rows: List[Any] = None,
    require_verified_status: bool = False,
) -> float:
    """
    Secondary GPA calculation path used for course-level breakdowns/previews.

    IMPORTANT: this now shares scoring logic with score_to_gpa via
    _score_to_gpa_for_scale instead of maintaining an independent mapping,
    so it can no longer silently diverge from calculate_gpa/calculate_cgpa.

    Args:
        scale_rows: the institution's actual grading scale.
        require_verified_status: if True, only counts courses
            whose status is verified/locked. Default is False for course-level
            breakdowns/previews and public calculator usage where status is absent.
    """
    if scale_rows is None:
        scale_rows = []

    eligible_courses = []
    for c in courses:
        score = getattr(c, "score", None)
        if score is None and isinstance(c, dict):
            score = c.get("score", 0.0)
        credits = getattr(c, "credit_hours", None)
        if credits is None and isinstance(c, dict):
            credits = c.get("credit_hours", 0.0)

        if require_verified_status:
            status_val = getattr(c, "status", None)
            if status_val is None and isinstance(c, dict):
                status_val = c.get("status", "")
            status_val = (status_val or "").lower()
            if status_val and status_val not in GPA_ELIGIBLE_STATUSES:
                continue

        gp = _score_to_gpa_for_scale(score, grading_scale, scale_rows)

        if gp is not None:
            eligible_courses.append((gp, credits))

    if not eligible_courses:
        return 0.0

    total_points = sum(gp * credits for gp, credits in eligible_courses)
    total_credits = sum(credits for gp, credits in eligible_courses)

    if total_credits == 0:
        return 0.0

    return round(total_points / total_credits, 2)


def calculate_public_gpa(
    courses: List[Any],
    grading_scale: str = "4.0",
    scale_rows: List[Any] = None,
) -> dict:
    """
    PUBLIC PATHWAY: Calculate instant GPA for public / unauthenticated users.

    Accepts course inputs without requiring verification status.
    Returns calculated GPA, total credit hours, and detailed course breakdown.
    """
    gpa = calculate_gpa_from_courses(
        courses=courses,
        grading_scale=grading_scale,
        scale_rows=scale_rows,
        require_verified_status=False
    )

    total_credit_hours = sum(
        getattr(c, "credit_hours", None) or (c.get("credit_hours", 0.0) if isinstance(c, dict) else 0.0)
        for c in courses
    )

    breakdown = get_course_breakdown(
        courses=courses,
        grading_scale=grading_scale,
        scale_rows=scale_rows
    )

    return {
        "gpa": gpa,
        "total_credit_hours": total_credit_hours,
        "course_breakdown": breakdown
    }


>>>>>>> 2e98b9e (fix(gpa-calc): separate public and private calculation pathways, fix mark entry and management)
def get_course_breakdown(
    courses: List[Any],
    grading_scale: str = "4.0",
    scale_rows: List[Any] = None,
) -> List[dict]:
    """
    Per-course breakdown for display. Shares scoring logic with
    calculate_gpa_from_courses via _score_to_gpa_for_scale.
    """
    if scale_rows is None:
        scale_rows = []

    breakdown = []
    for c in courses:
        score = getattr(c, "score", None)
        if score is None:
            score = c.get("score", 0.0)
        name = getattr(c, "course_name", None)
        if name is None:
            name = c.get("course_name", "")

        letter_grade = score_to_letter_grade_default(score)
        gp = _score_to_gpa_for_scale(score, grading_scale, scale_rows)

        breakdown.append({
            "course_name": name,
            "letter_grade": letter_grade,
            # "value" replaces the old overloaded "grade_points" field name,
            # since under grading_scale="percentage" this is a raw score,
            # not a GPA point value — keep the meaning unambiguous.
            "value": gp,
            "value_type": "gpa_points" if grading_scale != "percentage" else "percentage",
            # Kept for backward compatibility with existing callers.
            "grade_points": gp,
        })
    return breakdown