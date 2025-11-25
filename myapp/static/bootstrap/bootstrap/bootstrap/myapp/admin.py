from django.contrib import admin
from .models import *
# Register your models here.
class RegisterAdmin(admin.ModelAdmin):
    list_display = ['name','email','password','phone','gender']
admin.site.register(Register,RegisterAdmin)
class LoginAdmin(admin.ModelAdmin):
    list_display = ['email','password']
admin.site.register(Login,LoginAdmin)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ['user','password','phone','name','email','gender']
# admin.site.register(Profile,ProfileAdmin)

class AchievementsAdmin(admin.ModelAdmin):
    list_display = ['title','description','image']
admin.site.register(Achievements,AchievementsAdmin)


class FAQAdmin(admin.ModelAdmin):
    list_display = ['question','answer']
admin.site.register(FAQ,FAQAdmin)

class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ['help_type','question','created_at']
admin.site.register(HelpRequest,HelpRequestAdmin)

admin.site.register(Blog)
admin.site.register(Paragraphs)