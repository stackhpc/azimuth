"""
This module defines the exceptions that can be thrown by cloud operations.

A lot of the time, errors will be raised with a :py:class:`ProviderSpecificError`
as the cause, i.e. using the ``raise ... from ...`` syntax.
"""

__author__ = "Matt Pryor"
__copyright__ = "Copyright 2015 UK Science and Technology Facilities Council"


class CloudServiceError(RuntimeError):
    """Base class for all errors thrown by cloud services."""
    
class ProviderConnectionError(CloudServiceError):
    """Thrown if a provider cannot be connected to."""
    
class ProviderUnavailableError(CloudServiceError):
    """Thrown when a provider connects but reports an error."""
    
class ProviderSpecificError(CloudServiceError):
    """Base class for provider specific errors."""
    
class ImplementationError(CloudServiceError):
    """Thrown when an error occurs in the implementation or the implementation
       issues a bad request."""
    
class AuthenticationError(CloudServiceError):
    """Thrown when authentication with a provider fails."""
    
class PermissionsError(CloudServiceError):
    """Thrown when a session has insufficient permissions to perform an action."""
    
class NoSuchResourceError(CloudServiceError):
    """Thrown when a resource is requested that does not exist."""
    
class BadRequestError(CloudServiceError):
    """Thrown when a badly formatted request is made to the cloud service."""
    
class BadConfigurationError(CloudServiceError):
    """Thrown when the cloud service is configured in a way that the portal cannot use."""
    
class DuplicateNameError(CloudServiceError):
    """Thrown when a name conflicts with a resource that already exists."""
    
class InvalidActionError(CloudServiceError):
    """Thrown when an action is invalid given the current state of an entity."""
    
class ImageCreateError(CloudServiceError):
    """Thrown when an error occurs while creating a new image."""
    
class ImageDeleteError(CloudServiceError):
    """Thrown when an error occurs while deleting an image."""
    
class ProvisioningError(CloudServiceError):
    """Thrown when an error occurs during provisioning."""
    
class NetworkingError(CloudServiceError):
    """Thrown when an error occurs while performing a networking operation."""
    
class PowerActionError(CloudServiceError):
    """Thrown when an error occurs while performing a power action on a VM."""
    
class TaskFailedError(CloudServiceError):
    """Thrown when a long running task fails."""
    
class TaskCancelledError(TaskFailedError):
    """Thrown when a task fails due to being cancelled by a user."""
    
class TaskAbortedError(TaskFailedError):
    """Thrown when a task fails due to being aborted by an administrator."""
    