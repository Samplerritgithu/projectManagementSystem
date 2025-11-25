from django.shortcuts import render,redirect
from .models import *
from django.contrib import messages
from django.contrib.auth import authenticate,login,logout
from django.shortcuts import get_object_or_404

from .forms import FAQForm
def index(request):
    user = request.user
    if request.method == 'POST':
       
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')
        gender = request.POST.get('gender')
        user = User.objects.create_user(username=email, password=password)
        userprofile=Register.objects.create(
            user=user,
            name=name,
            email=email,
            password=password, 
            phone=phone,
            gender=gender
        )
        
        userprofile.save()
        print('user created',userprofile.user)
        return redirect('login')  
        

    else:
        return render(request, 'registration.html')
    return render(request, 'registration.html',{'userprofile':userprofile})
       
def login_user(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid email or password')
            return redirect('login')
    return render(request, 'login.html')

def home(request):
    return render(request,'home.html')

def logout_user(request):
    logout(request)
    return redirect('login')


def profile(request):
    user=request.user
    if request.user.is_authenticated:
        profiles = Register.objects.all()
    print("profiles",profiles)
    return render(request,'profile.html',{'profiles':profiles})

def update_profile(request, profile_id):
    profiles = Register.objects.get(id=profile_id)
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')
        gender = request.POST.get('gender')
        profiles.name = name
        profiles.email = email
        profiles.password = password
        profiles.phone = phone
        profiles.gender = gender
        profiles.save()
        return redirect('profile')
    return render(request, 'profile.html', {'profiles': profiles})
def delete_profile(request, profile_id):
    profiles = Register.objects.get(id=profile_id)
    profiles.delete()
    return redirect('profile')

def create_profile(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')
        gender = request.POST.get('gender')
        user = User.objects.create_user(username=email, password=password)
        userprofile = Register.objects.create(
            user=user,
            name=name,
            email=email,
            password=password,
            phone=phone,
            gender=gender
        )
        userprofile.save()
        return redirect('profile')
    return render(request, 'profile.html')

def acheivement(request):
    acheivements = Achievements.objects.all()
    user = request.user
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        acheivements = Achievements.objects.create(title=title, description=description, image=image,user=user)
        acheivements.save()
        return redirect('acheivements',{'acheivements':acheivements})
    else:
        return render(request,'acheivements.html',{'acheivements':acheivements})
    return render(request,'acheivements.html',{'acheivements':acheivements})


def create_achievement(request):
    if request.method == 'POST':
        user=request.user
        title = request.POST.get('title')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        acheivements = Achievements.objects.create(title=title, description=description,user=user, image=image)
        acheivements.save()
        print('acheivements',acheivements)
        return redirect('acheivement')
    return render(request, 'acheivements.html',{'acheivements': acheivements})
def delete_acheivement(request, acheivement_id):
    acheivements = Achievements.objects.get(id=acheivement_id)
    acheivements.delete()
    return redirect('acheivement')

def faqs(request):
    user = request.user
    if request.method == "POST":
        form = FAQForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('faqs')  
    else:
        form = FAQForm()

    faqs = FAQ.objects.all()  # Get all FAQs from the database
    return render(request, 'faqs.html', {
        'form': form,
        'faqs': faqs,
        'user':user
    })
def create_FAQ(request):
    user = request.user
    if request.method == 'POST':
        question = request.POST.get('question')
        answer = request.POST.get('answer')
        faqs = FAQ.objects.create(question=question, answer=answer,user=user)
        faqs.save()
        return redirect('faqs')
    return render(request, 'faqs.html')


def delete_faq(request,faq_id):
    faqs = FAQ.objects.get(id=faq_id)
    faqs.delete()
    return redirect('faqs')

def helpRequest(request):
    helpRequests = HelpRequest.objects.all()
    if request.method == 'POST':
        help_type = request.POST.get('help_type')
        question = request.POST.get('question')
        help_request = HelpRequest.objects.create(help_type=help_type, question=question)
        help_request.save()
        return redirect('home')
    return render(request, 'help.html', {'helpRequests': helpRequests})
def delete_help_request(request, help_request_id):
    help_request = HelpRequest.objects.get(id=help_request_id)
    help_request.delete()
    return redirect('helpRequest')

def blog_view(request):
    user = request.user
    if request.method == 'POST':
        print('all data',request.POST)

        title = request.POST.get('title')
        print("title",title)
        description = request.POST.get('description')
        print("description",description)
        blog = Blog.objects.create(title=title, description=description,user=user)
        blog.save()
        # paragraphs = request.POST.get('paragraphs')
        # print("paragraphs",paragraphs)
        paracount = request.POST.get('paracount')
        
        print("paracount", paracount)

        for i in range(int(paracount)):
            para_title = request.POST.get(f'paratitle_{i}')
            print("para_title",para_title)
            para_description = request.POST.get(f'paradescription_{i}')
            para_image=request.FILES.get(f'image_{i}')
            paragraph = Paragraphs.objects.create(paratitle=para_title,paradescription=para_description,image=para_image)
            paragraph.save()
            blog.paragraphs.add(paragraph)
        return redirect('blog_list')
    else:
        blogs = Blog.objects.all()
        return render(request, 'blog.html', {'blogs': blogs})

def show_blog(request):
    user = request.user
    blog = Blog.objects.all()
    return render(request, 'show_blog.html', {'blog': blog})

def open_blog(request, blog_id):
    blog = Blog.objects.get(id=blog_id)
    paragraphs = blog.paragraphs.all()
    return render(request, 'open_blog.html', {'blog': blog,'paragraphs':paragraphs})
def delete_blog(request, blog_id):
    blog = Blog.objects.get(id=blog_id)
    blog.delete()
    return redirect('show_blog')
