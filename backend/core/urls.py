from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings # Make sure this is imported
from django.conf.urls.static import static # Make sure this is imported

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.api.urls')),

    # YOUR PATTERNS
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Optional UI:
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

print(f"DEBUG (urls.py): settings.DEBUG is {settings.DEBUG}")
print(f"DEBUG (urls.py): Initial urlpatterns: {urlpatterns}")

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    print(f"DEBUG (urls.py): Static files serving ENABLED. This block was entered.")
    print(f"DEBUG (urls.py): STATIC_URL={settings.STATIC_URL}, STATIC_ROOT={settings.STATIC_ROOT}")
    print(f"DEBUG (urls.py): Final urlpatterns after static: {urlpatterns}")
else:
    print("DEBUG (urls.py): Static files serving DISABLED because DEBUG is False. This block was skipped.")

