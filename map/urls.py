from django.urls import path
from .views import init_map

urlpatterns = [
    path('', init_map, name='map'),
]
