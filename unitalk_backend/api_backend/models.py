from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = [('student', 'Student'), ('faculty', 'Faculty')]
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')

    @property
    def is_student(self):
        return self.user_type == 'student'

    @property
    def is_faculty(self):
        return self.user_type == 'faculty'

    def __str__(self):
        return f'{self.username} ({self.user_type})'


class QuestionModel(models.Model):

    DIFFICULTY_CHOICES = [
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    ]
    CATEGORY_CHOICES = [
        ('Investment Banking', 'Investment Banking'),
        ('Consulting', 'Consulting'),
    ]
    SUBCATEGORY_CHOICES = [
        ('Behavioral', 'Behavioral'),
        ('Financial', 'Financial'),
        ('Case', 'Case'),
    ]
    question = models.CharField(max_length=500)
    difficulty = models.CharField(max_length=100, choices=DIFFICULTY_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='Investment Banking')
    subcategory = models.CharField(max_length=20, choices=SUBCATEGORY_CHOICES, default='Behavioral')

    def __str__(self):
        return self.question

    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'


class AnswerModel(models.Model):
    question = models.ForeignKey(QuestionModel, on_delete=models.CASCADE, related_name='question_answers')
    answer = models.CharField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    strengths = models.JSONField(default=list, help_text='List of strength items')
    weaknesses = models.JSONField(default=list, help_text='List of weakness items')
    score = models.IntegerField(null=True, blank=True, help_text='AI-evaluated score 0–100')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='answers',
        limit_choices_to={'user_type': 'student'},
    )

    def __str__(self):
        return self.answer

    class Meta:
        verbose_name = 'Answer'
        verbose_name_plural = 'Answers'


class CV(models.Model):
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cv',
        limit_choices_to={'user_type': 'student'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'CV — {self.student.username}'


class Experience(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='experiences')
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    start_date = models.CharField(max_length=50)
    end_date = models.CharField(max_length=50, blank=True, default='')
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} @ {self.company}'


class Bullet(models.Model):
    experience = models.ForeignKey(Experience, on_delete=models.CASCADE, related_name='bullets')
    text = models.CharField(max_length=500)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='faculty_appointments',
        limit_choices_to={'user_type': 'faculty'},
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_appointments',
        limit_choices_to={'user_type': 'student'},
    )
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Appointment: {self.student} with {self.faculty} at {self.scheduled_at}'

    class Meta:
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'