import { getAuthToken } from './auth';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${endpoint}`;
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - please check your connection', 0);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
}

// HTTP method helpers
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};

// Specialized API methods for file uploads
export const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string = 'file',
  onProgress?: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append(fieldName, file);

    const xhr = new XMLHttpRequest();
    const token = getAuthToken();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new ApiError('Failed to parse response', xhr.status));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new ApiError(
            errorResponse.error || errorResponse.message || 'Upload failed',
            xhr.status,
            errorResponse
          ));
        } catch (error) {
          reject(new ApiError(`HTTP ${xhr.status}`, xhr.status));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error during upload', 0));
    });

    xhr.open('POST', endpoint);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  });
};

// Auth-specific API methods
export const auth = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  register: (userData: any) =>
    api.post('/api/auth/register', userData),

  logout: () =>
    api.post('/api/auth/logout'),

  me: () =>
    api.get('/api/me'),
};

// Job-related API methods
export const jobs = {
  search: (params: {
    q?: string;
    location?: string;
    employment_type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    return api.get(`/api/jobs/search?${searchParams}`);
  },

  recommendations: () =>
    api.get('/api/jobs/recommendations'),

  create: (jobData: any) =>
    api.post('/api/jobs', jobData),

  getMyJobs: () =>
    api.get('/api/jobs/mine'),

  update: (jobId: string, updates: any) =>
    api.put(`/api/jobs/${jobId}`, updates),

  delete: (jobId: string) =>
    api.delete(`/api/jobs/${jobId}/delete`),

  apply: (jobId: string) =>
    api.post(`/api/jobs/${jobId}/apply`),
};

// Application-related API methods
export const applications = {
  getMyApplications: () =>
    api.get('/api/applications/me'),

  getJobApplications: () =>
    api.get('/api/applications/jobs'),

  getJobApplicationsById: (jobId: string) =>
    api.get(`/api/applications/jobs/${jobId}`),

  updateStatus: (applicationId: string, status: string) =>
    api.put(`/api/applications/${applicationId}/status`, { status }),

  rankCandidates: (jobId: string) =>
    api.post(`/api/jobs/${jobId}/rank`),
};

// User/Profile API methods
export const users = {
  updateProfile: (updates: any) =>
    api.put('/api/me/update', updates),

  uploadResume: (file: File, onProgress?: (progress: number) => void) =>
    uploadFile('/api/me/resume', file, 'resume', onProgress),

  searchCandidates: (params: {
    q?: string;
    skills?: string;
    location?: string;
    min_experience?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/api/candidates/search?${searchParams}`);
  },
};

// Interview API methods
export const interviews = {
  schedule: (interviewData: {
    job_id: string;
    seeker_id: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }) =>
    api.post('/api/interviews', interviewData),

  getMyInterviews: () =>
    api.get('/api/interviews/me'),

  update: (interviewId: string, updates: any) =>
    api.put(`/api/interviews/${interviewId}`, updates),

  cancel: (interviewId: string) =>
    api.delete(`/api/interviews/${interviewId}/cancel`),

  getAvailability: (startDate: string, endDate: string) =>
    api.get(`/api/interviews/availability?start_date=${startDate}&end_date=${endDate}`),
};

// Chat API methods
export const chat = {
  getHistory: (applicationId: string) =>
    api.get(`/api/chat/${applicationId}/history`),
};
