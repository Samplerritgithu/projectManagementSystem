from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Client(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.name} - {self.company}'

class Project(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('In Progress', 'In Progress'),
        ('On Hold', 'On Hold'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    project_id = models.CharField(max_length=10, unique=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(max_length=1000, blank=True, null=True)  # Limit to ~100 words
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='In Progress')
    progress = models.IntegerField(default=0)
    members = models.ManyToManyField(User, related_name='assigned_projects', blank=True)

    def save(self, *args, **kwargs):
        # Ensure project_id is set before first save
        if not self.project_id:
            last_project = Project.objects.order_by('-project_id').first()
            if last_project and last_project.project_id:
                try:
                    last_id = int(last_project.project_id)
                    self.project_id = str(last_id + 1)
                except ValueError:
                    self.project_id = '1001'
            else:
                self.project_id = '1001'

        # First save to obtain a primary key (required before accessing relations like tasks)
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Compute progress/status after PK exists; update only if changed
        previous_status = self.status
        previous_progress = self.progress
        self.calculate_progress_and_status()
        if self.status != previous_status or self.progress != previous_progress:
            super().save(update_fields=['status', 'progress'])
    
    def calculate_progress_and_status(self):
        """Calculate project progress and set status automatically"""
        total_tasks = self.tasks.count()
        
        if total_tasks == 0:
            if self.status == 'In Progress':
                self.progress = 0
            return
        
        # Count completed tasks (status = 'Done')
        completed_tasks = self.tasks.filter(status='Done').count()
        
        # Calculate progress percentage
        self.progress = int((completed_tasks / total_tasks) * 100)
        
        # Auto-set status based on progress
        if self.progress == 0:
            self.status = 'In Progress'
        elif self.progress == 100:
            self.status = 'Completed'
        else:
            self.status = 'In Progress'
    
    def update_progress(self):
        """Update project progress and status based on current tasks"""
        self.calculate_progress_and_status()
        self.save(update_fields=['progress', 'status'])
    
    def __str__(self):
        return f"{self.project_id} - {self.name}"


class Task(models.Model):
    STATUS_CHOICES = [
        ('To-do', 'To-do'),
        ('In Progress', 'In Progress'),
        ('Review', 'Review'),
        ('Done', 'Done'),
    ]
    
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    page_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='To-do')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    # Stores the assignee's project role used when the task was assigned (e.g., Frontend, Backend)
    assigned_to_role = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return self.title


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='project_comments')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.created_at.strftime("%Y-%m-%d")}'

class Document(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='project_documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Notification(models.Model):
    TYPE_CHOICES = [
        ('Task Assigned', 'Task Assigned'),
        ('Task Updated', 'Task Updated'),
        ('Project Invite', 'Project Invite'),
        ('Deadline Approaching', 'Deadline Approaching'),
        ('Task Reassigned', 'Task Reassigned'),
        ('Task Comment', 'Task Comment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.title}'



class Settings(models.Model):
    SETTING_TYPE_CHOICES = [
        ('boolean', 'Boolean'),
        ('integer', 'Integer'),
        ('string', 'String'),
        ('json', 'JSON'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPE_CHOICES, default='string')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.key} - {self.setting_type}"
class Room(models.Model):
    ROOM_TYPE_CHOICES = (
        ('public', 'Public'),
        ('private', 'Private'),
    )

    name = models.CharField(max_length=100, unique=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES, default='private')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.room_type})"

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')

    def __str__(self):
        return f"{self.user.username}: {self.message[:30]}"
class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f'{self.user.username if self.user else "System"} - {self.action_type} - {self.timestamp.strftime("%Y-%m-%d %H:%M")}'

    class Meta:
        ordering = ['-timestamp']




class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Role of the user within the project (e.g., Developer, Tester, Team Lead)
    role = models.JSONField(max_length=50, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Project Member"
        verbose_name_plural = "Project Members"

    def __str__(self):
        return f'{self.user.username} - {self.project.name}'

class TeamRole(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
    
class Teams(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='teams')
    team_lead = models.ForeignKey(User, on_delete=models.CASCADE, related_name='led_teams')
    team_role = models.ForeignKey(TeamRole, on_delete=models.SET_NULL, null=True, blank=True)
    members = models.ManyToManyField(User, related_name='team_members', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Team"
        verbose_name_plural = "Teams"
        unique_together = ('project', 'team_role')

    def __str__(self):
        return f'{self.project.name} - {self.team_role} Team (Lead: {self.team_lead.username})'
    
class UserProfile(models.Model):
    empid = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email = models.EmailField(max_length=30, null=True, blank=True)
    password = models.CharField(max_length=15, null=True, blank=True)

    ROLE_CHOICES = [
        ('Manager', 'Manager'),
        ('Trainee','Trainee'),
        ('Designer', 'Designer'),
        ('Team Lead', 'Team Lead'),
        ('Developer', 'Developer'),
        ('Tester', 'Tester'),
        ('HR', 'HR'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Developer')
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    primary_color = models.CharField(max_length=7, default='#1e88e5')
    font_size = models.CharField(max_length=10, choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')], default='medium')



    def __str__(self):
        return f"{self.user.username} - {self.empid}"



class DailyStatus(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='daily_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    status_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# Signal handlers to automatically update project progress when tasks change
@receiver(post_save, sender=Task)
def update_project_progress_on_task_save(sender, instance, **kwargs):
    """Update project progress when a task is created or updated"""
    if instance.project:
        instance.project.update_progress()

@receiver(post_delete, sender=Task)
def update_project_progress_on_task_delete(sender, instance, **kwargs):
    """Update project progress when a task is deleted"""
    if instance.project:
        instance.project.update_progress()




