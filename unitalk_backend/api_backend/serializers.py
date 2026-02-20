from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import QuestionModel, AnswerModel, Appointment
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'user_type']

    def validate_user_type(self, value):
        if value not in ('student', 'faculty'):
            raise serializers.ValidationError("user_type must be 'student' or 'faculty'.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'student'),
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionModel
        fields = ['id', 'question', 'difficulty', 'category', 'subcategory']


class AnswerSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AnswerModel
        fields = ['id', 'question', 'answer', 'strengths', 'weaknesses', 'score', 'created_at', 'student']


class SubmitAnswerSerializer(serializers.Serializer):
    answer = serializers.CharField(max_length=5000)


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'faculty', 'student', 'scheduled_at', 'status', 'notes', 'created_at']
        read_only_fields = ['student', 'created_at']

    def validate(self, attrs):
        faculty = attrs.get('faculty')
        if faculty and not faculty.is_faculty:
            raise serializers.ValidationError({'faculty': 'The selected user is not a faculty member.'})
        return attrs


class FacultyAppointmentListSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'faculty', 'student', 'scheduled_at', 'status', 'notes', 'created_at']


class StudentAppointmentSerializer(serializers.ModelSerializer):
    faculty = UserSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'faculty', 'scheduled_at', 'status', 'notes', 'created_at']


class AnswerWithQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = AnswerModel
        fields = ['id', 'question', 'answer', 'strengths', 'weaknesses', 'score', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_type'] = user.user_type
        token['username'] = user.username
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
