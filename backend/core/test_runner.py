"""
Test runner defaults.

- interactive: Django defaults to True and will prompt before dropping an
  existing test DB. Agent/CI shells often cannot answer stdin, so we default
  to non-interactive (auto-clobber). Set DJANGO_TEST_INTERACTIVE=1 for prompts.

- keepdb: With Neon/serverless Postgres, tearing down the test DB often fails
  with "database is being accessed by other users" (pooler sessions). For
  postgres DATABASE_URL we default keepdb=True. Set DJANGO_TEST_NO_KEEPDB=1
  to force destroy-after-run (Django default).
"""

import os

from django.test.runner import DiscoverRunner


def _postgres_database_url():
    url = os.environ.get("DATABASE_URL", "")
    return url.startswith(("postgres://", "postgresql://"))


class CookbookDiscoverRunner(DiscoverRunner):
    def __init__(self, interactive=True, keepdb=False, **kwargs):
        if interactive and os.environ.get("DJANGO_TEST_INTERACTIVE", "").lower() not in (
            "1",
            "true",
            "yes",
        ):
            interactive = False

        if (
            _postgres_database_url()
            and not keepdb
            and os.environ.get("DJANGO_TEST_NO_KEEPDB", "").lower() not in ("1", "true", "yes")
        ):
            keepdb = True

        super().__init__(interactive=interactive, keepdb=keepdb, **kwargs)
