from rest_framework.permissions import BasePermission


def _get_roles(user):
    try:
        return user.profile.roles or []
    except Exception:
        return []


class IsAuthenticatedCustom(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return bool(request.user.is_staff or (profile and profile.is_admin))


class HasRole(BasePermission):
    required_role = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(view, 'required_role', self.required_role)
        if not role:
            return True
        roles = _get_roles(request.user)
        return role in roles
