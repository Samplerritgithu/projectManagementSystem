from rest_framework import serializers
from .models import *
class RegisterSerializer(serializers.ModelSerializer):
    empname = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    empid = serializers.CharField(required=False)

    class Meta:
        model = UserProfile
        fields = ['empname', 'email', 'password', 'role', 'phone', 'empid']

    def create(self, validated_data):
        try:
            password = validated_data.pop('password')
            email = validated_data.get('email')
            empname = validated_data.get('empname')
            role = validated_data.get('role')

            # Generate next empid if not provided
            if 'empid' not in validated_data or not validated_data['empid']:
                last_profile = UserProfile.objects.order_by('-id').first()
                if last_profile and last_profile.empid.isdigit():
                    empid = str(int(last_profile.empid) + 1)
                else:
                    empid = "1001"
            else:
                empid = validated_data['empid']

            # Create Django User
            user = User.objects.create_user(
                username=empname,
                email=email,
                password=password
            )

            # Create UserProfile WITHOUT team
            user_profile = UserProfile.objects.create(
                user=user,
                empid=empid,
                name=empname,  # ✅ store name from frontend input
                email=email,
                role=role,
                phone=validated_data.get('phone')
            )

            return user_profile

        except Exception as e:
            print(f"Error in create: {str(e)}")
            raise


class LoginSerializer(serializers.Serializer):
    employeeId = serializers.CharField()
    password = serializers.CharField()

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'read', 'created_at', 'link']
        read_only_fields = ['created_at']
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'start_date', 'due_date', 'description', 'page_name', 'priority', 'status']

class TeamsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teams
        fields = ['id', 'team_name', 'team_type', 'team_manager']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    team = TeamsSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['empid', 'role', 'phone', 'team', 'user','email','empname','profile_picture']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'uploaded_by', 'uploaded_at', 'project']