import os

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')


class DynamicCallbackMixin:
    """Use callback_url from request body so the same backend serves any frontend origin."""

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        callback_url = self.request.data.get('callback_url')
        if callback_url:
            ctx['callback_url'] = callback_url
        return ctx


class GoogleLogin(DynamicCallbackMixin, SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = f"{FRONTEND_URL}/login"
    client_class = OAuth2Client


class GitHubLogin(DynamicCallbackMixin, SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = f"{FRONTEND_URL}/login"
    client_class = OAuth2Client
