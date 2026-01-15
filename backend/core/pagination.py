from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Custom pagination that allows page_size to be set via query parameter."""
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000
