const API_BASE_URL = 'http://localhost:8000/api';
export const API_HOST = API_BASE_URL.replace(/\/?api\/?$/, '');

export const toAbsoluteUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${API_HOST}${path}`;
  return path;
};

// Token expire callback fonksiyonu - dışarıdan set edilecek
let onTokenExpire: (() => void) | null = null;

/**
 * Token expire callback'ini ayarla
 * AuthContext bu fonksiyonu kullanarak logout işlemini tetikleyebilir
 */
export const setTokenExpireCallback = (callback: () => void) => {
  onTokenExpire = callback;
};

/**
 * API request fonksiyonu - otomatik token ekleme ve expire kontrolü ile
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // LocalStorage'dan token al
  const token = localStorage.getItem('token');

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Eğer token varsa Authorization header'ına ekle
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Başarısız HTTP yanıtları: gövdeyi sadece bir kez oku ve kullanıcı dostu mesaj üret
    if (!response.ok) {
      let data: any = null;
      try {
        data = await response.json();
      } catch {
        try {
          const text = await response.text();
          data = { message: (text || '').trim() };
        } catch {
          data = {};
        }
      }

      const status = response.status;
      const backendMessage: string | undefined = data?.message || data?.error || data?.msg;

      // 401/403 için token süresi doldu mu kontrolü (body tek sefer okundu)
      if (status === 401 || status === 403) {
        const expireMessages = [
          'Token sürümü eski',
          'Oturum süreniz doldu',
          'Token doğrulama hatası',
          'jwt expired',
          'refresh token',
        ];
        const isTokenExpired = !!backendMessage && expireMessages.some((m) => backendMessage.toLowerCase().includes(m.toLowerCase()));
        if (isTokenExpired && onTokenExpire) {
          onTokenExpire();
          throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        }
      }

      // Validation hataları
      const validationErrors: string[] | undefined = Array.isArray(data?.errors) ? data.errors : undefined;

      // Duruma göre kullanıcı dostu mesaj oluştur
      const friendly = (() => {
        if (backendMessage) {
          // Bazı yaygın backend mesajlarını Türkçeleştir veya doğrudan göster
          return backendMessage;
        }
        switch (status) {
          case 400:
            return validationErrors?.length ? `Doğrulama hatası: ${validationErrors.join(', ')}` : 'Geçersiz istek.';
          case 401:
            return 'Yetkisiz işlem. Lütfen giriş yapın.';
          case 403:
            return 'Bu işlem için yetkiniz yok.';
          case 404:
            return 'Kayıt bulunamadı.';
          case 409:
            return 'Çakışma oluştu. Lütfen bilgileri kontrol edin.';
          case 422:
            return validationErrors?.length ? `Doğrulama hatası: ${validationErrors.join(', ')}` : 'Doğrulama hatası.';
          case 429:
            return 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.';
          default:
            return 'Sunucuda bir hata oluştu. Lütfen tekrar deneyin.';
        }
      })();

      throw new Error(friendly);
    }

    return response.json();
  } catch (error) {
    // Network hataları için
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.');
    }
    
    // Diğer hataları aynen fırlat
    throw error;
  }
};

// ==== Student - Coach Secret Feedback APIs ====

export type CoachFeedbackCategories = {
  communication: number;
  programQuality: number;
  overallSatisfaction: number;
};

export type CoachFeedbackSpecificIssues = {
  tooMuchPressure?: boolean;
  notEnoughSupport?: boolean;
  communicationProblems?: boolean;
  programNotSuitable?: boolean;
  other?: string;
};

export const getMyCoach = async () => {
  return apiRequest('/student/my-coach');
};

export const getCoachFeedbackStatus = async () => {
  return apiRequest('/student/feedback/coach/status');
};

export const submitCoachFeedback = async (payload: {
  coachId: string;
  categories: CoachFeedbackCategories;
  feedback: string;
  specificIssues?: CoachFeedbackSpecificIssues;
}) => {
  return apiRequest('/student/feedback/coach', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ==== Admin - Feedback Management ====
export type AdminFeedbackListItem = {
  id: string;
  coach: { id: string; name: string };
  student: { id: string; name: string };
  overallRating: number;
  status: 'new' | 'read';
  createdAt: string;
};

export const getAdminFeedbacks = async (params: { status?: 'new' | 'read'; limit?: number; offset?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  const qs = search.toString();
  return apiRequest(`/admin/feedbacks${qs ? `?${qs}` : ''}`);
};

export const getAdminFeedbackDetail = async (id: string) => {
  return apiRequest(`/admin/feedbacks/${id}`);
};

export const markAdminFeedbackRead = async (id: string) => {
  return apiRequest(`/admin/feedbacks/${id}/read`, { method: 'PUT' });
};

// ==== Admin - Coach Management ====
export type AdminCoachListItem = {
  _id: string;
  name: string;
  email: string;
  city?: string;
  avatar?: string | null;
  createdAt: string;
};

export const getAdminCoaches = async (params: { q?: string; page?: number; limit?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiRequest(`/admin/coaches${qs ? `?${qs}` : ''}`);
};

export type AdminCoachStudentItem = {
  _id: string;
  name: string;
  email: string;
  grade?: string;
  city?: string;
};

export const getAdminCoachStudents = async (
  coachId: string,
  params: { status?: 'active' | 'inactive'; page?: number; limit?: number } = {}
) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiRequest(`/admin/coaches/${coachId}/students${qs ? `?${qs}` : ''}`);
};

export const getAdminCoachPerformance = async (coachId: string) => {
  return apiRequest(`/admin/coaches/${coachId}/performance`);
};

export const assignCoach = async (payload: { coachId: string; studentIds: string[] }) => {
  return apiRequest('/admin/assign-coach', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const reassignStudent = async (payload: {
  studentId: string;
  fromCoachId: string;
  toCoachId: string;
  reason?: string;
}) => {
  return apiRequest('/admin/reassign-student', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// ==== Admin - Statistics ====
export type FeedbackSummary = {
  totalFeedbacks: number;
  averageRating: number;
  categoryAverages: {
    communication: number;
    programQuality: number;
    overallSatisfaction: number;
  };
  issuesCounts: {
    tooMuchPressure: number;
    notEnoughSupport: number;
    communicationProblems: number;
    programNotSuitable: number;
  };
  lastFeedbackDate: string | null;
  statusCounts: { new: number; read: number };
};

export const getAdminCoachesStatistics = async () => {
  return apiRequest('/admin/statistics/coaches');
};

export const getAdminFeedbackSummary = async (): Promise<{ message: string; data: FeedbackSummary }> => {
  return apiRequest('/admin/statistics/feedback-summary');
};

// ==== Admin - Users (basic list for assignment) ====
export const getAllUsers = async () => {
  return apiRequest('/users');
};

// ==== Student - Programs (Daily Plans) ====
export type StudentProgramSubject = {
  subject: string;
  description?: string;
  targetTime?: number;
  priority?: number;
  notes?: string;
  completedQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  blankAnswers?: number;
  studyTime?: number;
  status?: string;
};

export type StudentProgram = {
  _id: string;
  title?: string;
  date: string;
  status: 'draft' | 'active' | 'completed' | 'failed' | 'archived';
  subjects: StudentProgramSubject[];
};

export const getStudentPrograms = async (params: {
  status?: 'draft' | 'active' | 'completed' | 'failed' | 'archived';
  from?: string; // ISO
  to?: string;   // ISO
  page?: number;
  limit?: number;
} = {}) => {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiRequest(`/student/programs${qs ? `?${qs}` : ''}`);
};

export const getStudentProgramDetail = async (id: string) => {
  return apiRequest(`/student/programs/${id}`);
};

