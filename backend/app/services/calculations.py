from typing import List, Optional, Any

def score_to_gpa(score: float, scale_rows: List[Any]) -> Optional[float]:
    """
    Finds the GPA points for a given score based on the user's grading scale.
    """
    if not scale_rows:
        # Fallback to standard 4.0 scale if no rows are present
        if score >= 93: return 4.0
        elif score >= 90: return 3.7
        elif score >= 87: return 3.3
        elif score >= 83: return 3.0
        elif score >= 80: return 2.7
        elif score >= 77: return 2.3
        elif score >= 73: return 2.0
        elif score >= 70: return 1.7
        elif score >= 60: return 1.0
        else: return 0.0

    matching_rows = [
        row for row in scale_rows
        if score >= row.min_percent and (row.max_percent is None or score <= row.max_percent)
    ]
    if not matching_rows:
        return None
        
    # Return the row with the highest min_percent threshold
    best_row = max(matching_rows, key=lambda r: r.min_percent)
    return best_row.gpa_points

def calculate_gpa(marks: List[Any], scale_rows: List[Any] = None) -> float:
    """
    Calculate GPA for a single semester.
    Includes only 'verified' marks (case-insensitive for compatibility).
    Excludes marks with NULL grade points (Incomplete/Withdrawn/Freeze).
    """
    if scale_rows is None:
        scale_rows = []

    eligible_marks = []
    for m in marks:
        # Support both 'status' and old 'verification_status' fields
        status_val = getattr(m, "status", None) or getattr(m, "verification_status", None) or ""
        if status_val.lower() == "verified":
            gp = score_to_gpa(m.score, scale_rows)
            if gp is not None:
                eligible_marks.append((gp, m.credit_hours))

    if not eligible_marks:
        return 0.0

    total_points = sum(gp * credits for gp, credits in eligible_marks)
    total_credits = sum(credits for gp, credits in eligible_marks)

    if total_credits == 0:
        return 0.0

    return round(total_points / total_credits, 2)

def calculate_cgpa(all_marks: List[Any], scale_rows: List[Any] = None) -> float:
    """
    Calculate CGPA across all semesters.
    Includes 'verified' marks ONLY.
    Excludes marks with NULL grade points (Incomplete/Withdrawn/Freeze).
    """
    return calculate_gpa(all_marks, scale_rows)

def get_cgpa_projection(
    target_cgpa: float,
    remaining_semesters: int,
    current_cgpa: float,
    completed_credits: float,
    scale_rows: List[Any] = None
) -> dict:
    """
    Calculate the required GPA in remaining semesters to achieve target CGPA.
    Determines if it is achievable based on the max GPA points in the scale.
    """
    if remaining_semesters <= 0:
        return {
            "required_gpa": 0.0,
            "achievable": False
        }

    # Estimate future semesters credit load as 15.0 per semester
    remaining_credits = remaining_semesters * 15.0
    total_credits = completed_credits + remaining_credits
    
    required_points = (target_cgpa * total_credits) - (current_cgpa * completed_credits)
    required_gpa = required_points / remaining_credits
    required_gpa = round(required_gpa, 2)

    # Determine max GPA points from scale_rows (default to 4.0 if not available)
    max_gpa = 4.0
    if scale_rows:
        valid_points = [r.gpa_points for r in scale_rows if r.gpa_points is not None]
        if valid_points:
            max_gpa = max(valid_points)

    achievable = required_gpa <= max_gpa and required_gpa >= 0.0

    return {
        "required_gpa": required_gpa,
        "achievable": achievable
    }

def score_to_letter_grade_default(score: float) -> str:
    if score >= 93: return "A"
    elif score >= 90: return "A-"
    elif score >= 87: return "B+"
    elif score >= 83: return "B"
    elif score >= 80: return "B-"
    elif score >= 77: return "C+"
    elif score >= 73: return "C"
    elif score >= 70: return "C-"
    elif score >= 60: return "D"
    else: return "F"

def calculate_gpa_from_courses(courses: List[Any], grading_scale: str = "4.0") -> float:
    eligible_courses = []
    for c in courses:
        score = getattr(c, "score", None)
        if score is None:
            score = c.get("score", 0.0)
        credits = getattr(c, "credit_hours", None)
        if credits is None:
            credits = c.get("credit_hours", 0.0)

        if grading_scale == "4.0":
            gp = score_to_gpa(score, [])
        elif grading_scale == "5.0":
            gp_4_0 = score_to_gpa(score, [])
            gp = round(gp_4_0 * 1.25, 2) if gp_4_0 is not None else 0.0
        elif grading_scale == "percentage":
            gp = score
        else:
            gp = score_to_gpa(score, [])

        if gp is not None:
            eligible_courses.append((gp, credits))

    if not eligible_courses:
        return 0.0

    total_points = sum(gp * credits for gp, credits in eligible_courses)
    total_credits = sum(credits for gp, credits in eligible_courses)

    if total_credits == 0:
        return 0.0

    return round(total_points / total_credits, 2)

def get_course_breakdown(courses: List[Any], grading_scale: str = "4.0") -> List[dict]:
    breakdown = []
    for c in courses:
        score = getattr(c, "score", None)
        if score is None:
            score = c.get("score", 0.0)
        name = getattr(c, "course_name", None)
        if name is None:
            name = c.get("course_name", "")
            
        letter_grade = score_to_letter_grade_default(score)
        
        if grading_scale == "4.0":
            gp = score_to_gpa(score, [])
        elif grading_scale == "5.0":
            gp_4_0 = score_to_gpa(score, [])
            gp = round(gp_4_0 * 1.25, 2) if gp_4_0 is not None else 0.0
        elif grading_scale == "percentage":
            gp = score
        else:
            gp = score_to_gpa(score, [])
            
        breakdown.append({
            "course_name": name,
            "letter_grade": letter_grade,
            "grade_points": gp
        })
    return breakdown
