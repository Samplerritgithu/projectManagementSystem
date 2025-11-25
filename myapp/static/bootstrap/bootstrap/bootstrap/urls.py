"""
URL configuration for bootstrap project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from myapp.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('index/',index,name='index'),
    path('',login_user,name='login'),
    path('home/',home,name='home'),
    path('logout/',logout_user,name='logout'),
    path('profile/',profile,name='profile'),
    path('update_profile/<int:profile_id>/', update_profile, name='update_profile'),
    path('delete_profile/<int:profile_id>/', delete_profile, name='delete_profile'),
    path('create_profile/',create_profile,name='create_profile'),
    path('acheivement/',acheivement,name='acheivement'),
    path('create_acheivement/',create_achievement,name='create_acheivement'),
    path('delete_acheivement/<int:acheivement_id>/',delete_acheivement,name='delete_acheivement'),
    path('faqs/',faqs,name='faqs'),
    path('create_FAQ/',create_FAQ,name='create_FAQ'),
    path('delete_faq/<int:faq_id>/',delete_faq,name='delete_faq'),
    path('helpRequest/',helpRequest,name='helpRequest'),
    path('delete_help_request/<int:help_request_id>/',delete_help_request,name='delete_help_request'),
    path('blogs/', blog_view, name='blog_list'), 
    path('show_blog/', show_blog, name='show_blog'), 
    path('open_blog/<int:blog_id>/', open_blog, name='open_blog'),
    path('delete_blog/<int:blog_id>/', delete_blog, name='delete_blog'), # For deleting a blog
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
