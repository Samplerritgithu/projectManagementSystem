from django.db import models
from django.contrib.auth.models import User

class Register(models.Model):
    # Defining choices for gender
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]
    user = models.ForeignKey(User,on_delete=models.CASCADE)

    # Fields for registration
    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50, unique=True)  # Added unique=True for email
    password = models.CharField(max_length=50)
    phone = models.CharField(max_length=10)  # Changed to CharField for phone numbers to handle leading zeros
    gender = models.CharField(max_length=6, choices=GENDER_CHOICES)

    def __str__(self):
        return self.name
class Login(models.Model):
    email = models.EmailField(max_length=50)
    password = models.CharField(max_length=50)

    def __str__(self):
        return self.email

# class Profile(models.Model):
#     user = models.OneToOneField(User,on_delete=models.CASCADE)
#     password = models.CharField(max_length=50)
#     phone = models.CharField(max_length=10)
#     name = models.CharField(max_length=50)
#     email = models.EmailField(max_length=50)
#     phone  = models.CharField(max_length=10)
#     gender= models.CharField(max_length=6)

#     def __str__(self):
#         return self.user.name

class Achievements(models.Model):
    title = models.CharField(max_length=50)
    description = models.TextField(max_length=200)
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True,blank=True)
    image = models.ImageField(upload_to='images/', null=True, blank=True)

    def __str__(self):
        return self.title

class FAQ(models.Model):
    question = models.CharField(max_length=100)
    answer = models.TextField(max_length=200)
    user= models.ForeignKey(User,on_delete=models.CASCADE,null=True,blank=True)

    def __str__(self):
        return self.question

class HelpRequest(models.Model):
    # Choices for the help type
    HELP_TYPE_CHOICES = [
        ('technical', 'Technical Support'),
        ('account', 'Account Issues'),
        ('general', 'General Inquiry'),
    ]
    
    help_type = models.CharField(max_length=20,choices=HELP_TYPE_CHOICES)
    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Help Request - {self.help_type} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"

class Paragraphs(models.Model):
    paratitle=models.CharField(max_length=300)
    paradescription=models.TextField()
    image=models.ImageField(upload_to='images/', null=True, blank=True) 
    def __str__(self):
        return self.paratitle
class Blog(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    title=models.CharField(max_length=300)
    description=models.TextField()
    paragraphs=models.ManyToManyField(Paragraphs,null=True,blank=True)
    def __str__(self):
        return self.title


