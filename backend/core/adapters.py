"""Auth adapters: OAuth-only signup and safer social email linking."""

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class AccountAdapter(DefaultAccountAdapter):
    """Block password/email signup; this app is OAuth-only in the UI."""

    def is_open_for_signup(self, request):
        return False


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Allow new users via Google/GitHub while keeping password signup closed."""

    def is_open_for_signup(self, request, sociallogin):
        return True

    def can_authenticate_by_email(self, login, email):
        """
        Only link social login to an existing local account when that email is
        already verified. Otherwise an attacker can pre-register an unverified
        address via any leftover signup path and inherit the victim's OAuth
        session (API tokens survive allauth's password wipe).
        """
        if not super().can_authenticate_by_email(login, email):
            return False
        return EmailAddress.objects.filter(
            email__iexact=email,
            verified=True,
        ).exists()
