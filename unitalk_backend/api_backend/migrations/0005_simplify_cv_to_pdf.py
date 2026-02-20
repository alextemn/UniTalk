from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_backend', '0004_cv_experience_bullet'),
    ]

    operations = [
        migrations.DeleteModel(name='Bullet'),
        migrations.DeleteModel(name='Experience'),
        migrations.RemoveField(model_name='cv', name='created_at'),
        migrations.RenameField(model_name='cv', old_name='updated_at', new_name='uploaded_at'),
        migrations.AddField(
            model_name='cv',
            name='pdf_data',
            field=models.BinaryField(default=b''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='cv',
            name='filename',
            field=models.CharField(default='cv.pdf', max_length=255),
        ),
        migrations.AlterField(
            model_name='cv',
            name='uploaded_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
