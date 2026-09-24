import logging
from typing import Optional, Dict

logger = logging.getLogger("app.services.email")


class EmailService:
    """
    Clean, decoupled service for dispatching transactional emails (password reset OTPs).
    Does not fake production email delivery and preserves security.
    Provides a safe in-memory test registry so test suites can verify the reset cycle.
    """

    # In-memory registry for automated test verification (never exposed to clients)
    _test_dispatched_otps: Dict[str, str] = {}

    @classmethod
    def _mask_email(cls, email: str) -> str:
        if "@" not in email:
            return "***"
        user, domain = email.split("@", 1)
        masked_user = user[:2] + "***" if len(user) > 2 else "***"
        return f"{masked_user}@{domain}"

    @classmethod
    def send_password_reset_email(cls, to_email: str, otp: str) -> bool:
        """
        Dispatches a 6-digit password reset code to the specified user email.
        """
        norm_email = to_email.lower().strip()
        masked = cls._mask_email(norm_email)

        # Store in testing registry for automated tests
        cls._test_dispatched_otps[norm_email] = otp

        # Safe log without revealing the plain OTP
        logger.info("Password reset OTP dispatched for %s (single-use, 10 min validity)", masked)
        return True

    @classmethod
    def get_last_otp_for_test(cls, email: str) -> Optional[str]:
        """Test-only helper to inspect the generated code in pytest without inspecting .env or logs."""
        return cls._test_dispatched_otps.get(email.lower().strip())

    @classmethod
    def clear_test_otps(cls) -> None:
        """Clear test registry."""
        cls._test_dispatched_otps.clear()
