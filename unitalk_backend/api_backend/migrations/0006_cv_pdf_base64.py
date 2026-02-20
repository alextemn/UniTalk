from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_backend', '0005_simplify_cv_to_pdf'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cv',
            name='pdf_data',
        ),
        migrations.AddField(
            model_name='cv',
            name='pdf_base64',
            field=models.TextField(blank=True, default=''),
        ),
    ]
