import time
import os
from .models import AuditLog
from django.utils.deprecation import MiddlewareMixin

class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._audit_start = time.time()

    def process_response(self, request, response):
        try:
            start = getattr(request, '_audit_start', None)
            duration = int((time.time() - start) * 1000) if start else 0
            user = getattr(request, 'user', None)
            ip = request.META.get('REMOTE_ADDR')
            ua = request.META.get('HTTP_USER_AGENT')
            AuditLog.objects.create(
                user=user if getattr(user, 'is_authenticated', False) else None,
                method=request.method,
                path=request.path,
                status_code=getattr(response, 'status_code', 0),
                duration_ms=duration,
                ip=ip,
                user_agent=ua,
            )
        except Exception:
            pass
        return response


class IPAllowlistMiddleware(MiddlewareMixin):
    """Restrict sensitive endpoints to allowed IPs via env ADMIN_IP_ALLOWLIST=ip1,ip2
       Applies to /api/admin/stats/ and /api/audit-logs/
    """
    def process_request(self, request):
        allowlist = os.getenv('ADMIN_IP_ALLOWLIST', '').strip()
        if not allowlist:
            return None
        path = request.path or ''
        if path.startswith('/api/admin/stats') or path.startswith('/api/audit-logs'):
            client_ip = request.META.get('REMOTE_ADDR')
            allowed = [ip.strip() for ip in allowlist.split(',') if ip.strip()]
            if client_ip not in allowed:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('IP not allowed')
        return None
