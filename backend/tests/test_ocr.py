import pytest
from app.services.ocr import perform_ocr, parse_grading_scale_table, check_rate_limit, memory_rates
from fastapi import HTTPException
import time

class TestOcrValidation:
    def test_invalid_mime_type_raises_value_error(self):
        # We send bytes containing the test hook for invalid mime
        with pytest.raises(ValueError) as exc_info:
            perform_ocr(b"invalid_mime")
        assert "Invalid file format" in str(exc_info.value)

    def test_file_too_large_raises_value_error(self):
        with pytest.raises(ValueError) as exc_info:
            perform_ocr(b"file_too_large")
        assert "exceeds the 5MB limit" in str(exc_info.value)


class TestOcrConfidence:
    def test_low_confidence_marks_flagged(self):
        res = perform_ocr(b"low_confidence")
        assert res["flagged"] is True
        assert "low_confidence_fields" in res
        assert len(res["low_confidence_fields"]) > 0


class TestOcrGradingScaleErrorCodes:
    def test_grading_scale_low_confidence_returns_distinct_code(self):
        res = parse_grading_scale_table(b"low_confidence")
        assert res["flagged"] is True
        assert res["error_code"] == "GRADING_SCALE_LOW_CONFIDENCE"

    def test_grading_scale_malformed_returns_distinct_code(self):
        res = parse_grading_scale_table(b"malformed")
        assert res["flagged"] is True
        assert res["error_code"] == "GRADING_SCALE_MALFORMED"

    def test_error_codes_are_distinct(self):
        res_low = parse_grading_scale_table(b"low_confidence")
        res_mal = parse_grading_scale_table(b"malformed")
        assert res_low["error_code"] != res_mal["error_code"]


class TestOcrRateLimiting:
    def test_rate_limiting_blocks_eleventh_call(self):
        user_id = "test-rate-limit-user"
        # Reset memory rates list
        memory_rates[user_id] = []
        
        # Make 10 successful checks
        for _ in range(10):
            assert check_rate_limit(user_id) is True
            
        # 11th check must fail
        assert check_rate_limit(user_id) is False
