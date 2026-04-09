"""
Social login views. GitHub uses two OAuth apps (separate callback URLs per app).

Set on Render (and optionally locally):
  GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET — production (e.g. Vercel callback)
  GITHUB_CLIENT_ID_DEV / GITHUB_CLIENT_SECRET_DEV — local dev (localhost callback)

settings.SOCIALACCOUNT_PROVIDERS['github']['APP'] should match production.
"""
import os

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')


def _is_localhost_callback(callback_url: str) -> bool:
    if not callback_url:
        return False
    lower = callback_url.lower()
    return 'localhost' in lower or '127.0.0.1' in lower


def _resolve_github_credentials(callback_url: str) -> tuple[str, str]:
    prod_id = os.environ.get('GITHUB_CLIENT_ID', '')
    prod_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')
    dev_id = os.environ.get('GITHUB_CLIENT_ID_DEV', '')
    dev_secret = os.environ.get('GITHUB_CLIENT_SECRET_DEV', '')
    if _is_localhost_callback(callback_url) and dev_id and dev_secret:
        return dev_id, dev_secret
    return prod_id, prod_secret


class DynamicGitHubOAuth2Adapter(GitHubOAuth2Adapter):
    """Use dev or prod GitHub OAuth credentials based on request callback_url."""

    def get_provider(self):
        provider = super().get_provider()
        callback_url = ''
        if hasattr(self.request, 'data') and self.request.data is not None:
            callback_url = self.request.data.get('callback_url') or ''
        client_id, secret = _resolve_github_credentials(callback_url)
        if provider.app is not None:
            provider.app.client_id = client_id
            provider.app.secret = secret
        return provider


def _callback_url_from_view(view):
    """dj-rest-auth reads view.callback_url via getattr; use request body when present."""
    if hasattr(view, 'request') and view.request:
        url = view.request.data.get('callback_url')
        if url:
            return url
    return f"{FRONTEND_URL}/login"


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return _callback_url_from_view(self)

    @callback_url.setter
    def callback_url(self, value):
        pass


class GitHubLogin(SocialLoginView):
    adapter_class = DynamicGitHubOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return _callback_url_from_view(self)

    @callback_url.setter
    def callback_url(self, value):
        pass
