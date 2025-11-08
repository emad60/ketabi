from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import SchoolRequest
from .serializers import SchoolRequestSerializer


class SchoolRequestViewSet(viewsets.ModelViewSet):
    queryset = (
        SchoolRequest.objects
        .select_related("school", "created_by", "reviewed_by")
        .prefetch_related("items")
        .order_by("-id")
    )
    serializer_class = SchoolRequestSerializer

    # تصفية/بحث/ترتيب
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "school", "created_by", "reviewed_by"]
    search_fields = ["reason_rejected"]
    ordering_fields = ["id", "created_at", "updated_at"]

    # ——— إجراءات عملية بسيطة ———

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """تحويل الطلب من draft إلى submitted"""
        obj = self.get_object()
        if obj.status != "draft":
            return Response({"detail": "لا يمكن الإرسال إلا من حالة draft."}, status=400)
        obj.status = "submitted"
        obj.save(update_fields=["status"])
        return Response({"detail": "تم إرسال الطلب للمحافظة.", "status": obj.status})

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """اعتماد المحافظة"""
        obj = self.get_object()
        if obj.status not in ["submitted", "rejected"]:
            return Response({"detail": "يمكن الاعتماد بعد الإرسال فقط."}, status=400)
        obj.status = "approved"
        if request.user and request.user.is_authenticated:
            obj.reviewed_by = request.user
        obj.reason_rejected = None
        obj.save(update_fields=["status", "reviewed_by", "reason_rejected"])
        return Response({"detail": "تم الاعتماد.", "status": obj.status})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """رفض المحافظة مع سبب"""
        obj = self.get_object()
        reason = request.data.get("reason_rejected")
        if not reason:
            return Response({"detail": "الرجاء إدخال سبب الرفض (reason_rejected)."}, status=400)
        if obj.status not in ["submitted", "approved"]:
            return Response({"detail": "يمكن الرفض بعد الإرسال/قبل التوريد."}, status=400)
        obj.status = "rejected"
        obj.reason_rejected = reason
        if request.user and request.user.is_authenticated:
            obj.reviewed_by = request.user
        obj.save(update_fields=["status", "reason_rejected", "reviewed_by"])
        return Response({"detail": "تم الرفض.", "status": obj.status})

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """إلغاء المدرسة"""
        obj = self.get_object()
        if obj.status not in ["draft", "submitted", "rejected"]:
            return Response({"detail": "لا يمكن الإلغاء بعد الاعتماد/التوريد."}, status=400)
        obj.status = "cancelled"
        obj.save(update_fields=["status"])
        return Response({"detail": "تم إلغاء الطلب.", "status": obj.status})

    @action(detail=True, methods=["post"])
    def fulfill(self, request, pk=None):
        """تمّ توريد الكتب للمدرسة (غالبًا يُضبط تلقائيًا بعد التسليم)"""
        obj = self.get_object()
        if obj.status != "approved":
            return Response({"detail": "التحويل إلى fulfilled يكون بعد الاعتماد."}, status=400)
        obj.status = "fulfilled"
        obj.save(update_fields=["status"])
        return Response({"detail": "تمّ التوريد.", "status": obj.status})
