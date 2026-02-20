from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from django.utils import timezone
from django.http import HttpResponse
import base64
from datetime import timedelta
from collections import defaultdict

from .models import QuestionModel, AnswerModel, Appointment, CV
from .serializers import (
    QuestionSerializer,
    AnswerSerializer,
    AnswerWithQuestionSerializer,
    SubmitAnswerSerializer,
    RegisterSerializer,
    AppointmentSerializer,
    FacultyAppointmentListSerializer,
    StudentAppointmentSerializer,
    CVSerializer,
)
from .openai_service import evaluate_answer


class QuestionListView(APIView):
    def get(self, request):
        questions = QuestionModel.objects.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.is_student:
            return Response({'detail': 'Only students can add questions.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = QuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class QuestionDetailView(APIView):
    def get(self, request, pk):
        question = get_object_or_404(QuestionModel, pk=pk)
        serializer = QuestionSerializer(question)
        return Response(serializer.data)


class SubmitAnswerView(APIView):
    def post(self, request, pk):
        question = get_object_or_404(QuestionModel, pk=pk)

        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        answer_text = serializer.validated_data['answer']
        try:
            evaluation = evaluate_answer(question, answer_text)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        student = request.user if request.user.is_authenticated else None

        answer = AnswerModel.objects.create(
            question=question,
            answer=answer_text,
            strengths=evaluation['strengths'],
            weaknesses=evaluation['weaknesses'],
            score=evaluation['score'],
            student=student,
        )

        return Response(AnswerSerializer(answer).data, status=status.HTTP_201_CREATED)


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        from .serializers import UserSerializer
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class StudentAnswerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        answers = AnswerModel.objects.filter(student=request.user).select_related('question').order_by('-created_at')
        serializer = AnswerWithQuestionSerializer(answers, many=True)
        return Response(serializer.data)


class PerformanceOverTimeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        
        category_filter = request.query_params.get('category', None)
        subcategory_filter = request.query_params.get('subcategory', None)
        
        # Get all answers for the student
        answers = AnswerModel.objects.filter(
            student=request.user,
            score__isnull=False
        ).select_related('question').order_by('created_at')
        
        # Apply filters if provided
        if category_filter:
            answers = answers.filter(question__category=category_filter)
        if subcategory_filter:
            answers = answers.filter(question__subcategory=subcategory_filter)
        
        # Group by month
        performance_by_month = defaultdict(lambda: {'scores': [], 'count': 0})
        
        for answer in answers:
            month_key = answer.created_at.strftime('%Y-%m')
            performance_by_month[month_key]['scores'].append(answer.score)
            performance_by_month[month_key]['count'] += 1
        
        # Calculate averages and format data
        result = []
        for month in sorted(performance_by_month.keys()):
            scores = performance_by_month[month]['scores']
            avg_score = sum(scores) / len(scores) if scores else 0
            result.append({
                'month': month,
                'average_score': round(avg_score, 1),
                'count': performance_by_month[month]['count']
            })
        
        return Response({
            'performance_data': result,
            'filters': {
                'category': category_filter,
                'subcategory': subcategory_filter
            }
        })


class PerformanceByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get performance grouped by category
        answers = AnswerModel.objects.filter(
            student=request.user,
            score__isnull=False
        ).select_related('question')
        
        category_performance = defaultdict(lambda: {'scores': [], 'count': 0})
        
        for answer in answers:
            category = answer.question.category
            category_performance[category]['scores'].append(answer.score)
            category_performance[category]['count'] += 1
        
        result = []
        for category, data in category_performance.items():
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            result.append({
                'category': category,
                'average_score': round(avg_score, 1),
                'count': data['count']
            })
        
        return Response(result)


class PerformanceBySubcategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        
        category_filter = request.query_params.get('category', None)
        
        # Get performance grouped by subcategory
        answers = AnswerModel.objects.filter(
            student=request.user,
            score__isnull=False
        ).select_related('question')
        
        if category_filter:
            answers = answers.filter(question__category=category_filter)
        
        subcategory_performance = defaultdict(lambda: {'scores': [], 'count': 0})
        
        for answer in answers:
            subcategory = answer.question.subcategory
            subcategory_performance[subcategory]['scores'].append(answer.score)
            subcategory_performance[subcategory]['count'] += 1
        
        result = []
        for subcategory, data in subcategory_performance.items():
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            result.append({
                'subcategory': subcategory,
                'average_score': round(avg_score, 1),
                'count': data['count']
            })
        
        return Response(result)


class FacultyAppointmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_faculty:
            return Response({'detail': 'Only faculty can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        appointments = Appointment.objects.filter(faculty=request.user).select_related('student')
        serializer = FacultyAppointmentListSerializer(appointments, many=True)
        return Response(serializer.data)


class AppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        appointments = Appointment.objects.filter(student=request.user).select_related('faculty').order_by('-scheduled_at')
        serializer = StudentAppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Only students can book appointments.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(student=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FacultyAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_faculty:
            return Response({'detail': 'Only faculty can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)

        answers = AnswerModel.objects.filter(score__isnull=False).select_related('question', 'student')

        subcategory_data = defaultdict(lambda: {'scores': [], 'count': 0})
        category_data = defaultdict(lambda: {'scores': [], 'count': 0})
        difficulty_data = defaultdict(lambda: {'scores': [], 'count': 0})

        for answer in answers:
            subcat = answer.question.subcategory
            cat = answer.question.category
            diff = answer.question.difficulty
            subcategory_data[subcat]['scores'].append(answer.score)
            subcategory_data[subcat]['count'] += 1
            category_data[cat]['scores'].append(answer.score)
            category_data[cat]['count'] += 1
            difficulty_data[diff]['scores'].append(answer.score)
            difficulty_data[diff]['count'] += 1

        def build_result(data_dict, key_name):
            return [
                {
                    key_name: k,
                    'average_score': round(sum(v['scores']) / len(v['scores']), 1),
                    'count': v['count'],
                }
                for k, v in data_dict.items()
            ]

        total_answers = answers.count()
        total_students = answers.values('student').distinct().count()
        overall_avg = round(sum(a.score for a in answers) / total_answers, 1) if total_answers else 0
        pending_appointments = Appointment.objects.filter(faculty=request.user, status='pending').count()

        return Response({
            'by_subcategory': build_result(subcategory_data, 'subcategory'),
            'by_category': build_result(category_data, 'category'),
            'by_difficulty': build_result(difficulty_data, 'difficulty'),
            'stats': {
                'total_students': total_students,
                'total_answers': total_answers,
                'overall_average_score': overall_avg,
                'pending_appointments': pending_appointments,
            },
        })


class FacultyListView(APIView):
    def get(self, request):
        User = get_user_model()
        faculty = User.objects.filter(user_type='faculty').values('id', 'username', 'email')
        return Response(list(faculty))


class AppointmentStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_faculty:
            return Response({'detail': 'Only faculty can update appointment status.'}, status=status.HTTP_403_FORBIDDEN)
        appointment = get_object_or_404(Appointment, pk=pk, faculty=request.user)
        new_status = request.data.get('status')
        if new_status not in ('confirmed', 'cancelled', 'pending'):
            return Response(
                {'detail': 'Invalid status. Must be confirmed, cancelled, or pending.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = new_status
        appointment.save()
        return Response(FacultyAppointmentListSerializer(appointment).data)


class StudentCVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Students only.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            cv = CV.objects.get(student=request.user, pdf_base64__gt='')
            return Response(CVSerializer(cv).data)
        except CV.DoesNotExist:
            return Response(None)

    def post(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Students only.'}, status=status.HTTP_403_FORBIDDEN)
        pdf_file = request.FILES.get('pdf')
        if not pdf_file:
            return Response({'error': 'No PDF provided.'}, status=status.HTTP_400_BAD_REQUEST)
        cv, _ = CV.objects.get_or_create(student=request.user)
        cv.pdf_base64 = base64.b64encode(pdf_file.read()).decode('utf-8')
        cv.filename = pdf_file.name
        cv.save()
        return Response(CVSerializer(cv).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Students only.'}, status=status.HTTP_403_FORBIDDEN)
        CV.objects.filter(student=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentCVDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_student:
            return Response({'detail': 'Students only.'}, status=status.HTTP_403_FORBIDDEN)
        cv = get_object_or_404(CV, student=request.user)
        pdf_bytes = base64.b64decode(cv.pdf_base64)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{cv.filename}"'
        return response


class FacultyStudentCVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if not request.user.is_faculty:
            return Response({'detail': 'Faculty only.'}, status=status.HTTP_403_FORBIDDEN)
        has_appointment = Appointment.objects.filter(
            faculty=request.user,
            student__id=student_id,
        ).exists()
        if not has_appointment:
            return Response({'detail': 'No appointment found with this student.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            cv = CV.objects.get(student__id=student_id, pdf_base64__gt='')
            return Response(CVSerializer(cv).data)
        except CV.DoesNotExist:
            return Response(None)


class FacultyStudentCVDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if not request.user.is_faculty:
            return Response({'detail': 'Faculty only.'}, status=status.HTTP_403_FORBIDDEN)
        has_appointment = Appointment.objects.filter(
            faculty=request.user,
            student__id=student_id,
        ).exists()
        if not has_appointment:
            return Response({'detail': 'No appointment found with this student.'}, status=status.HTTP_403_FORBIDDEN)
        cv = get_object_or_404(CV, student__id=student_id)
        pdf_bytes = base64.b64decode(cv.pdf_base64)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{cv.filename}"'
        return response


class FacultyStudentAnswersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if not request.user.is_faculty:
            return Response({'detail': 'Only faculty can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        User = get_user_model()
        student = get_object_or_404(User, pk=student_id, user_type='student')
        answers = AnswerModel.objects.filter(student=student).select_related('question').order_by('-created_at')
        serializer = AnswerWithQuestionSerializer(answers, many=True)
        return Response(serializer.data)
