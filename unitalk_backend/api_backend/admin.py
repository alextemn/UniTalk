from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, QuestionModel, AnswerModel, Appointment


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('User Type', {'fields': ('user_type',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('User Type', {'fields': ('user_type',)}),
    )
    list_display = ['username', 'email', 'user_type', 'is_staff']
    list_filter = ['user_type', 'is_staff', 'is_active']


admin.site.register(QuestionModel)
admin.site.register(AnswerModel)
admin.site.register(Appointment)
