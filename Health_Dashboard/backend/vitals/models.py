from django.db import models
from django.contrib.auth.models import User

class HealthRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_records')
    created_at = models.DateTimeField(auto_now_add=True)
    age = models.IntegerField(default=25, help_text="Age of the user for health calculations")
    # 1. Vitals (Chỉ số sinh tồn & Tiêu chuẩn BP/BMI mới)
    blood_pressure_sys = models.IntegerField(help_text="Systolic Blood Pressure (mmHg)")
    blood_pressure_dia = models.IntegerField(help_text="Diastolic Blood Pressure (mmHg)")
    bp_medication = models.BooleanField(default=False, help_text="True if using antihypertensive medication (-20 pts penalty)")
    
    weight = models.FloatField(help_text="Weight in kg")
    height = models.FloatField(help_text="Height in cm")
    bmi = models.FloatField(blank=True, null=True, help_text="Calculated via Asian Population Standard")
    
    # 2. Youth Lifestyle Habits (Sửa đổi theo tiêu chí AHA 2022 tối ưu)
    sleep_hours = models.FloatField(help_text="Daily sleep duration (8th formal metric)")
    
    # Thay vì một trường chung, tách làm 2 để Backend tự động tính toán: 1 min vigorous = 2 mins moderate
    moderate_activity_min = models.IntegerField(default=0, help_text="Moderate physical activity minutes per week")
    vigorous_activity_min = models.IntegerField(default=0, help_text="Vigorous physical activity minutes per week")
    
    # Thay Boolean bằng CharField để phân tầng thời gian cai thuốc/vaping độc lập
    NICOTINE_CHOICES = [
        ('never', 'Never smoked/vaped'),
        ('quit_5y', 'Quit >= 5 years'),
        ('quit_1_5y', 'Quit 1 to < 5 years'),
        ('vaping_or_quit_1y', 'Current Vaping or Quit < 1 year'),
        ('traditional', 'Current traditional smoking'),
    ]
    nicotine_status = models.CharField(max_length=30, choices=NICOTINE_CHOICES, default='never', help_text="Nicotine exposure level")
    secondhand_smoke = models.BooleanField(default=False, help_text="Regular exposure to secondhand smoke (-20 pts penalty)")
    
    # Yếu tố nền tảng (Foundational Factor) - Không tính vào điểm trung bình, dùng làm trigger UI warning
    stress_level = models.IntegerField(help_text="Psychological Stress scale from 1-10")
    
    # 3. Automated Wearable Data (Dữ liệu tự động từ thiết bị đeo)
    resting_heart_rate = models.FloatField(blank=True, null=True, help_text="Extracted via SciPy from wearable file")
    
    # 4. Calculated Scoring Outputs (Điểm số đầu ra)
    overall_cvh_score = models.FloatField(blank=True, null=True, help_text="Composite AHA 0-100 score (Unweighted average of 5 components)")

# Thêm vào cuối các thuộc tính của lớp HealthRecord (ngay trên hàm def save)
    hr_color = models.CharField(max_length=10, default="green", help_text="Color alert level for UI mapping")
    chart_data = models.JSONField(blank=True, null=True, help_text="Stored downsampled waveform chart data")

    def save(self, *args, **kwargs):
        # Tự động tính chỉ số BMI trước khi lưu vào DB (Giữ nguyên logic của hai bạn)
        if self.weight and self.height:
            height_m = self.height / 100.0
            self.bmi = round(self.weight / (height_m ** 2), 1)
        super(HealthRecord, self).save(*args, **kwargs)

    def __str__(self):
        return f"Record for {self.user.username} at {self.created_at.strftime('%Y-%m-%d')}"