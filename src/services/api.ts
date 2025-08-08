const API_BASE_URL = 'http://localhost:8000/api';

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

    // Token expire kontrolü - 401 veya 403 durumlarında
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      
      // Backend'den gelen mesajlara göre token expire kontrolü
      const expireMessages = [
        'Token sürümü eski',
        'Oturum süreniz doldu',
        'Token doğrulama hatası',
        'jwt expired'
      ];
      
      const isTokenExpired = expireMessages.some(msg => 
        errorData.message?.toLowerCase().includes(msg.toLowerCase())
      );

      if (isTokenExpired && onTokenExpire) {
        // Token expire callback'ini çağır - AuthContext logout yapacak
        onTokenExpire();
        throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
      }
    }

    // Diğer HTTP hataları için
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'Bir hata oluştu');
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
