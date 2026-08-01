"""Regression: unverified password signup must not capture later OAuth logins."""

from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialLogin
from allauth.socialaccount.providers.google.provider import GoogleProvider
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.messages.middleware import MessageMiddleware
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.sites.models import Site
from django.test import Client, RequestFactory, TestCase
from rest_framework.authtoken.models import Token

User = get_user_model()


class PasswordSignupClosedTests(TestCase):
    def test_accounts_signup_rejects_new_password_users(self):
        client = Client(enforce_csrf_checks=False)
        get_res = client.get("/accounts/signup/")
        self.assertEqual(get_res.status_code, 200)
        self.assertIn(b"Sign Up Closed", get_res.content)

        post_res = client.post(
            "/accounts/signup/",
            {
                "email": "victim@gmail.com",
                "username": "attacker_pre",
                "password1": "AttackerPass123!",
                "password2": "AttackerPass123!",
            },
        )
        self.assertEqual(post_res.status_code, 200)
        self.assertIn(b"Sign Up Closed", post_res.content)
        self.assertFalse(User.objects.filter(username="attacker_pre").exists())
        self.assertFalse(
            EmailAddress.objects.filter(email__iexact="victim@gmail.com").exists()
        )


class SocialEmailAuthenticationTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.site = Site.objects.get_or_create(
            id=1, defaults={"domain": "example.com", "name": "example"}
        )[0]
        SocialApp.objects.filter(provider="google").delete()
        self.app = SocialApp.objects.create(
            provider="google",
            name="google",
            client_id="test-google-client",
            secret="test-google-secret",
        )
        self.app.sites.add(self.site)

    def _request(self):
        request = self.factory.post("/accounts/google/login/callback/")
        SessionMiddleware(lambda r: None).process_request(request)
        request.session.save()
        MessageMiddleware(lambda r: None).process_request(request)
        request.user = AnonymousUser()
        return request

    def _google_login(self, email: str, uid: str = "google-victim-uid") -> SocialLogin:
        request = self._request()
        provider = GoogleProvider(request, app=self.app)
        return SocialLogin(
            user=User(email=email),
            account=SocialAccount(provider="google", uid=uid),
            email_addresses=[
                EmailAddress(email=email, verified=True, primary=True),
            ],
            provider=provider,
        )

    def test_unverified_local_email_does_not_capture_social_login(self):
        attacker = User.objects.create_user(
            username="attacker_pre",
            email="victim@gmail.com",
            password="AttackerPass123!",
        )
        EmailAddress.objects.create(
            user=attacker,
            email="victim@gmail.com",
            verified=False,
            primary=True,
        )
        Token.objects.create(user=attacker)

        sociallogin = self._google_login("victim@gmail.com")
        sociallogin.lookup()

        self.assertIsNone(sociallogin._did_authenticate_by_email)
        # Must not resolve to the attacker’s unverified pre-registration.
        self.assertNotEqual(getattr(sociallogin.user, "pk", None), attacker.pk)

    def test_verified_local_email_still_links_social_login(self):
        owner = User.objects.create_user(
            username="real_owner",
            email="owner@gmail.com",
            password="OwnerPass123!",
        )
        EmailAddress.objects.create(
            user=owner,
            email="owner@gmail.com",
            verified=True,
            primary=True,
        )

        sociallogin = self._google_login("owner@gmail.com", uid="google-owner-uid")
        sociallogin.lookup()

        self.assertEqual(sociallogin._did_authenticate_by_email, "owner@gmail.com")
        self.assertEqual(sociallogin.user.pk, owner.pk)
