import numpy as np
from scipy.signal import find_peaks
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, JSONParser
from .models import HealthRecord
from .serializers import RegisterSerializer

# ==========================================
# 1. API ĐĂNG KÝ
# ==========================================
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registration successful!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 2. API ĐÁNH GIÁ SỨC KHỎE (ĐÃ NÂNG CẤP LƯU TRỮ HOÀN CHỈNH)
# ==========================================
class EvaluateHealthView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request, format=None):
        user = request.user
        file_obj = request.FILES.get('file')
        resting_hr = 0
        chart_data = []

        if file_obj:
            try:
                ecg_data = []
                max_lines_to_read = 75000 
                lines_read = 0

                for line in file_obj:
                    cleaned = line.decode('utf-8').strip()
                    if not cleaned: continue
                    parts = cleaned.replace(',', ' ').split()
                    if len(parts) >= 2:
                        try:
                            ecg_data.append(float(parts[1]))
                            lines_read += 1
                        except ValueError: continue
                    elif len(parts) == 1:
                        try:
                            ecg_data.append(float(parts[0]))
                            lines_read += 1
                        except ValueError: continue
                    if lines_read >= max_lines_to_read: break
                
                if len(ecg_data) > 10:
                    ecg_arr = np.array(ecg_data)
                    sampling_rate = 250
                    
                    if len(ecg_data) < 7500:
                        min_distance = 10
                        min_prominence = 0.05
                    else:
                        min_distance = sampling_rate * 0.6 
                        min_prominence = np.std(ecg_arr) * 0.8
                    
                    peaks, _ = find_peaks(ecg_arr, distance=min_distance, prominence=min_prominence)
                    
                    if len(peaks) > 1:
                        intervals = np.diff(peaks) / sampling_rate
                        bpm_raw = 60.0 / np.mean(intervals)
                        if 40 <= bpm_raw <= 220:
                            resting_hr = round(bpm_raw, 1)
                    
                    if resting_hr == 0:
                        resting_hr = 40.0
                    
                    step = max(1, len(ecg_data) // 150)
                    chart_data = [
                        {"time": round(i / sampling_rate, 2), "ECG": float(ecg_data[i])} 
                        for i in range(0, len(ecg_data), step)
                    ]
            except Exception as e:
                return Response({"error": f"Lỗi xử lý file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if resting_hr == 0:
            resting_hr = 72.0

        # --- XỬ LÝ DỮ LIỆU FORM ---
        try:
            data = request.data
            age = int(data.get('age', 25))
            bp_sys = int(data.get('blood_pressure_sys', 120))
            bp_dia = int(data.get('blood_pressure_dia', 80))
            bp_med = data.get('bp_medication') in ['true', True, 'True']
            weight = float(data.get('weight', 65))
            height = float(data.get('height', 170))
            sleep = float(data.get('sleep_hours', 7.5))
            mod_act = int(data.get('moderate_activity_min', 0))
            vig_act = int(data.get('vigorous_activity_min', 0))
            nicotine = data.get('nicotine_status', 'never')
            secondhand = data.get('secondhand_smoke') in ['true', True, 'True']
            stress = int(data.get('stress_level', 5))

            # Logic chấm điểm AHA 2022
            sleep_score = 100 if 7 <= sleep < 9 else (70 if 6 <= sleep < 7 else 40)
            total_act = mod_act + (2 * vig_act)
            pa_score = 100 if total_act >= 150 else (60 if total_act >= 60 else 0)
            
            nic_score = 100 if nicotine == 'never' else (50 if nicotine == 'quit_5y' else 0)
            if secondhand: nic_score = max(0, nic_score - 20)
            
            bp_score = 100 if bp_sys < 120 and bp_dia < 80 else (50 if bp_sys < 140 else 0)
            if bp_med: bp_score = max(0, bp_score - 20)
            
            bmi = round(weight / ((height / 100) ** 2), 1)
            bmi_score = 100 if 18.5 <= bmi <= 22.9 else (50 if 23 <= bmi <= 24.9 else 0)

            overall_score = round((sleep_score + pa_score + nic_score + bp_score + bmi_score) / 5, 1)

            max_hr = 220 - age
            hr_color = "green"
            hr_msg = "Normal Heart Rate: Pumping efficiently and healthy."
            is_emergency = False
            
            if resting_hr < 50:
                hr_color = "red"
                hr_msg = "ALARM: Dangerous Bradycardia! Seek medical help immediately if feeling dizzy or faint."
                is_emergency = True
            elif 50 <= resting_hr <= 59:
                hr_color = "yellow"
                hr_msg = "Mild Bradycardia: Usually normal for athletes or during deep sleep."
            elif 60 <= resting_hr <= 100:
                hr_color = "green"
                hr_msg = "Normal Heart Rate: Pumping efficiently and healthy."
            elif 101 <= resting_hr <= 149:
                hr_color = "orange"
                hr_msg = "Mild Tachycardia: Stressed, fever, high caffeine, or vaping."
            else:
                hr_color = "red"
                hr_msg = "ALARM: Dangerous Tachycardia! Possible acute arrhythmias, seek urgent medical care!"
                is_emergency = True

            # LƯU VÀO DATABASE (Bổ sung thêm trường màu sắc và dữ liệu biểu đồ JSON)
            HealthRecord.objects.create(
                user=user, age=age, blood_pressure_sys=bp_sys, blood_pressure_dia=bp_dia, bp_medication=bp_med,
                weight=weight, height=height, sleep_hours=sleep, moderate_activity_min=mod_act, vigorous_activity_min=vig_act,
                nicotine_status=nicotine, secondhand_smoke=secondhand, stress_level=stress,
                resting_heart_rate=resting_hr, overall_cvh_score=overall_score,
                hr_color=hr_color, chart_data=chart_data # <-- Hai cột vừa thêm mới ở Bước 1
            )

            return Response({
                "overall_cvh_score": overall_score,
                "bmi": bmi,
                "extracted_heart_rate": resting_hr,
                "hr_color": hr_color,
                "hr_message": hr_msg,
                "max_hr": max_hr,
                "target_mod": f"{int(max_hr * 0.5)}-{int(max_hr * 0.7)} bpm",
                "target_vig": f"{int(max_hr * 0.7)}-{int(max_hr * 0.85)} bpm",
                "medical_warning": "Dynamic data analysis completed successfully." if overall_score >= 80 else "Hồ sơ sức khỏe cần cải thiện.",
                "chart_data": chart_data,
                "is_emergency": is_emergency
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": f"Lỗi nhập liệu từ Form: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 3. API LẤY DANH SÁCH LỊCH SỬ CHẨN ĐOÁN (MỚI BỔ SUNG)
# ==========================================
class DiagnosticsHistoryView(APIView):
    permission_classes = [IsAuthenticated] # Chỉ cho phép người dùng đã đăng nhập xem lịch sử của chính họ

    def get(self, request):
        user = request.user
        # Lấy toàn bộ bản ghi của user hiện tại, sắp xếp theo thời gian mới nhất lên đầu
        records = HealthRecord.objects.filter(user=user).order_by('-created_at')
        
        history_list = []
        for r in records:
            # Tính toán các dải nhịp tim mục tiêu dựa theo tuổi đã lưu của bản ghi cũ
            max_hr = 220 - r.age
            
            # Khôi phục thông điệp lâm sàng tương ứng với nhịp tim cũ
            is_emergency = r.resting_heart_rate < 50 or r.resting_heart_rate >= 150
            if r.resting_heart_rate < 50:
                hr_msg = "ALARM: Dangerous Bradycardia! Seek medical help immediately if feeling dizzy or faint."
            elif 50 <= r.resting_heart_rate <= 59:
                hr_msg = "Mild Bradycardia: Usually normal for athletes or during deep sleep."
            elif 60 <= r.resting_heart_rate <= 100:
                hr_msg = "Normal Heart Rate: Pumping efficiently and healthy."
            elif 101 <= r.resting_heart_rate <= 149:
                hr_msg = "Mild Tachycardia: Stressed, fever, high caffeine, or vaping."
            else:
                hr_msg = "ALARM: Dangerous Tachycardia! Possible acute arrhythmias, seek urgent medical care!"

            history_list.append({
                "id": r.id,
                "created_at": r.created_at.isoformat(),
                "age": r.age,
                "blood_pressure_sys": r.blood_pressure_sys,
                "blood_pressure_dia": r.blood_pressure_dia,
                "bp_medication": r.bp_medication,
                "weight": r.weight,
                "height": r.height,
                "bmi": r.bmi,
                "sleep_hours": r.sleep_hours,
                "moderate_activity_min": r.moderate_activity_min,
                "vigorous_activity_min": r.vigorous_activity_min,
                "nicotine_status": r.nicotine_status,
                "secondhand_smoke": r.secondhand_smoke,
                "stress_level": r.stress_level,
                "extracted_heart_rate": r.resting_heart_rate, # Đồng bộ tên biến ánh xạ ra bảng Frontend
                "overall_cvh_score": r.overall_cvh_score,
                "hr_color": r.hr_color,
                "hr_message": hr_msg,
                "max_hr": max_hr,
                "target_mod": f"{int(max_hr * 0.5)}-{int(max_hr * 0.7)} bpm",
                "target_vig": f"{int(max_hr * 0.7)}-{int(max_hr * 0.85)} bpm",
                "medical_warning": "Dynamic data analysis completed successfully." if r.overall_cvh_score >= 80 else "Hồ sơ sức khỏe cần cải thiện.",
                "chart_data": r.chart_data, # Trả về mảng tọa độ sóng để vẽ lại đồ thị khi nhấn nút xem lại
                "is_emergency": is_emergency
            })
            
        return Response(history_list, status=status.HTTP_200_OK)