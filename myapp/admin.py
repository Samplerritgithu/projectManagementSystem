from django.contrib import admin
from . models import *

admin.site.register(Teams)
admin.site.register(UserProfile)
admin.site.register(Client)
admin.site.register(Project)
admin.site.register(ProjectMember)
admin.site.register(Task)
admin.site.register(Comment)
admin.site.register(Document)
admin.site.register(Notification)
admin.site.register(Settings)
admin.site.register(ChatMessage)
admin.site.register(Room)
admin.site.register(TeamRole)