from django import forms
from .models import Project, Task, UserProfile, Client, ProjectMember
from django.utils import timezone
import re

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'client', 'description', 'deadline', 'budget', 'priority', 'status']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter project name',
                'maxlength': '40'
            }),
            'client': forms.Select(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Enter project description'
            }),
            'deadline': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'budget': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Enter budget'}),
            'priority': forms.Select(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
        }

    def clean_name(self):
        name = self.cleaned_data.get('name', '').strip()

        # Check for leading whitespace
        if name and name != name.lstrip():
            raise forms.ValidationError("Project name cannot have leading whitespaces.")

        # Check length (min 3, max 40)
        if len(name) < 3:
            raise forms.ValidationError("Project name must be at least 3 characters long.")
        if len(name) > 40:
            raise forms.ValidationError("Project name cannot exceed 40 characters.")

        # Check allowed characters: letters, numbers, spaces, hyphens, parentheses
        allowed_pattern = re.compile(r'^[a-zA-Z0-9\s\-()]+$')
        if not allowed_pattern.match(name):
            raise forms.ValidationError(
                "Project name can only contain letters, numbers, spaces, hyphens, and parentheses."
            )

        return name

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()

        if description:
            # Check word count (max 100 words)
            word_count = len(description.split())
            if word_count > 100:
                raise forms.ValidationError(f"Description cannot exceed 100 words. Current: {word_count} words.")

        return description

    def clean_deadline(self):
        deadline = self.cleaned_data.get('deadline')
        if deadline and deadline < timezone.now().date():
            raise forms.ValidationError("Deadline cannot be in the past.")
        return deadline

    def clean_budget(self):
        budget = self.cleaned_data.get('budget')
        if budget and budget < 0:
            raise forms.ValidationError("Budget cannot be negative.")
        return budget

class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'description', 'project', 'assigned_to', 'due_date', 'priority', 'status', 'estimated_hours']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter task title', 'maxlength': '150'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter task description'}),
            'project': forms.Select(attrs={'class': 'form-control'}),
            'assigned_to': forms.Select(attrs={'class': 'form-control'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'priority': forms.Select(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'estimated_hours': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Enter estimated hours'}),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title', '').strip()
        
        # Check length (min 3, max 150)
        if len(title) < 3:
            raise forms.ValidationError("Task title must be at least 3 characters long.")
        if len(title) > 150:
            raise forms.ValidationError("Task title cannot exceed 150 characters.")
        
        # Check allowed characters: letters, numbers, spaces, hyphens, parentheses
        allowed_pattern = re.compile(r'^[a-zA-Z0-9\s\-().]+$')
        if not allowed_pattern.match(title):
            raise forms.ValidationError("Task title can only contain letters, numbers, spaces, hyphens, and parentheses and dots.")
        
        # Check for duplicate task title in the same project
        project = self.cleaned_data.get('project')
        if project and title:
            existing_tasks = Task.objects.filter(project=project, title__iexact=title)
            # Exclude current instance if editing
            if self.instance and self.instance.pk:
                existing_tasks = existing_tasks.exclude(pk=self.instance.pk)
            if existing_tasks.exists():
                raise forms.ValidationError(f'A task with the title "{title}" already exists in this project. Please choose a different title.')
        
        return title

    def clean_due_date(self):
        due_date = self.cleaned_data.get('due_date')
        if due_date and due_date < timezone.now().date():
            raise forms.ValidationError("Due date cannot be in the past")
        return due_date

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['empid', 'email','role','phone']
        widgets = {
            'empid': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter employee ID'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter email address'}),
            'role': forms.Select(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter phone number'}),
        }

class ProjectMemberForm(forms.ModelForm):
    class Meta:
        model = ProjectMember
        fields = ['project', 'user']
        widgets = {
            'project': forms.Select(attrs={'class': 'form-control'}),
            'user': forms.Select(attrs={'class': 'form-control'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        project = cleaned_data.get('project')
        user = cleaned_data.get('user')

        # ✅ Check if this user is already part of the same project
        if project and user:
            existing = ProjectMember.objects.filter(
                project=project,
                user=user
            )
            # If editing, exclude the current instance
            if self.instance and self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise forms.ValidationError(
                    f'This user is already a member of the project "{project.name}".'
                )

        return cleaned_data


class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['name', 'email', 'phone', 'company', 'address']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter client name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter email address'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter phone number'}),
            'company': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter company name'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Enter address', 'rows': 3}),
        }


class MailForm(forms.Form):
    recipients = forms.ModelMultipleChoiceField(
        queryset=UserProfile.objects.filter(email__isnull=False).select_related('user'),
        widget=forms.SelectMultiple(attrs={'class': 'form-control', 'size': 10}),
        required=True,
        help_text='Hold Ctrl/Cmd to select multiple members'
    )
    subject = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Subject'}),
        required=True,
    )
    body = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 8, 'placeholder': 'Write your message...'}),
        required=True,
    )
    cc = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Comma-separated emails (optional)'}),
    )
    attachment = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'form-control'}),
    )

    def clean_cc(self):
        cc_value = self.cleaned_data.get('cc', '').strip()
        if not cc_value:
            return []
        emails = [e.strip() for e in cc_value.split(',') if e.strip()]
        # Basic validation using Django's EmailField
        email_field = forms.EmailField()
        valid_emails = []
        for email in emails:
            valid_emails.append(email_field.clean(email))
        return valid_emails

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Show user-friendly labels for recipients
        self.fields['recipients'].label_from_instance = lambda obj: f"{obj.user.get_full_name() or obj.user.username} <{obj.email}>"