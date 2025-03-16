from django.shortcuts import render
from django.conf import settings
def init_map(request):
    context = {
        'api_key': settings.MAP_API_KEY
    }
    return render(request, 'map.html', context)
# Create your views here.
