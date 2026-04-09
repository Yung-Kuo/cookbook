import os

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')


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
    adapter_class = GitHubOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return _callback_url_from_view(self)

    @callback_url.setter
    def callback_url(self, value):
        pass
