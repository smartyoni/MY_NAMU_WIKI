// Google Calendar API 서비스
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  htmlLink: string;
}

class GoogleCalendarService {
  private gapi: any = null;
  private isInitialized = false;
  private isSignedIn = false;
  private accessToken: string | null = null;

  // Google API 초기화 (Google Identity Services 사용)
  async initializeGAPI(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Google API 및 GSI 스크립트 로드
      if (!window.gapi) {
        await this.loadGAPIScript();
      }
      
      if (!window.google) {
        await this.loadGSIScript();
      }

      // GAPI 초기화 (클라이언트만)
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
            });
            
            this.gapi = window.gapi;
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // 저장된 토큰 확인
      this.checkStoredToken();
      
      return true;
    } catch (error) {
      console.error('Google API 초기화 실패:', error);
      return false;
    }
  }

  // 저장된 토큰 확인 및 로드
  private checkStoredToken(): void {
    try {
      const storedToken = localStorage.getItem('google_access_token');
      const tokenExpiry = localStorage.getItem('google_token_expiry');
      
      if (storedToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry, 10);
        const now = Date.now();
        
        // 토큰이 만료되지 않았으면 로그인 상태로 설정
        if (expiryTime > now) {
          this.accessToken = storedToken;
          this.isSignedIn = true;
          
          // gapi 클라이언트에 토큰 설정
          if (this.gapi && this.gapi.client) {
            this.gapi.client.setToken({ access_token: storedToken });
          }
          
          console.log('🔄 저장된 토큰으로 로그인 복원됨');
        } else {
          // 만료된 토큰 삭제
          this.clearStoredToken();
          console.log('⏰ 저장된 토큰이 만료되어 삭제됨');
        }
      }
    } catch (error) {
      console.error('저장된 토큰 확인 실패:', error);
      this.clearStoredToken();
    }
  }

  // 토큰을 로컬 스토리지에 저장
  private saveToken(accessToken: string, expiresIn: number = 3600): void {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000); // 초를 밀리초로 변환
      
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      console.log('💾 토큰 저장 완료, 만료시간:', new Date(expiryTime));
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  }

  // 저장된 토큰 삭제
  private clearStoredToken(): void {
    try {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_token_expiry');
      this.accessToken = null;
      this.isSignedIn = false;
    } catch (error) {
      console.error('토큰 삭제 실패:', error);
    }
  }

  // Google API 스크립트 동적 로드
  private loadGAPIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google API 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  // Google Identity Services 스크립트 로드
  private loadGSIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('GSI 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  // 구글 계정 로그인 (Google Identity Services 사용)
  async signIn(): Promise<boolean> {
    try {
      // API 키가 없으면 목업 데이터로 테스트
      if (!import.meta.env.VITE_GOOGLE_API_KEY || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.log('🔧 개발 모드: 목업 데이터로 테스트 중...');
        this.isSignedIn = true;
        return true;
      }

      if (!this.isInitialized) {
        const initialized = await this.initializeGAPI();
        if (!initialized) return false;
      }

      // Google Identity Services를 사용한 로그인
      return new Promise((resolve) => {
        window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          callback: (response: any) => {
            if (response.error) {
              console.error('OAuth 오류:', response.error);
              this.isSignedIn = false;
              this.clearStoredToken();
              resolve(false);
            } else {
              console.log('OAuth 성공:', response);
              this.isSignedIn = true;
              this.accessToken = response.access_token;
              
              // 토큰 저장 (기본 1시간, 응답에 expires_in이 있으면 그 값 사용)
              const expiresIn = response.expires_in || 3600;
              this.saveToken(response.access_token, expiresIn);
              
              // 액세스 토큰을 gapi 클라이언트에 설정
              window.gapi.client.setToken({ access_token: response.access_token });
              resolve(true);
            }
          }
        }).requestAccessToken();
      });
      
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      return false;
    }
  }

  // 구글 계정 로그아웃 (Google Identity Services)
  async signOut(): Promise<void> {
    try {
      if (this.isSignedIn && window.gapi && window.gapi.client) {
        // 토큰 제거
        window.gapi.client.setToken(null);
      }
      
      // 저장된 토큰 삭제
      this.clearStoredToken();
      
      console.log('🚪 로그아웃 완료');
    } catch (error) {
      console.error('구글 로그아웃 실패:', error);
    }
  }

  // 로그인 상태 확인
  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  // 오늘 일정 가져오기 (개발용 목업 포함)
  async getTodayEvents(): Promise<CalendarEvent[]> {
    try {
      if (!this.isSignedIn) {
        throw new Error('구글 계정에 로그인이 필요합니다.');
      }

      // API 키가 없으면 목업 데이터 반환
      if (!import.meta.env.VITE_GOOGLE_API_KEY || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.log('🔧 개발 모드: 목업 일정 데이터 반환');
        return this.getMockEvents();
      }

      // 오늘 날짜 범위 설정
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      });

      const events = response.result.items || [];
      
      return events.map((event: any): CalendarEvent => ({
        id: event.id,
        summary: event.summary || '제목 없음',
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        attendees: event.attendees,
        htmlLink: event.htmlLink
      }));

    } catch (error) {
      console.error('오늘 일정 가져오기 실패:', error);
      throw error;
    }
  }

  // 목업 일정 데이터 생성
  private getMockEvents(): CalendarEvent[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return [
      {
        id: 'mock1',
        summary: '🌅 오전 회의',
        description: '팀 스탠드업 미팅입니다.\n\n주요 안건:\n- 프로젝트 진행상황 점검\n- 오늘 할 일 공유\n- 이슈 및 블로커 논의',
        start: {
          dateTime: `${todayStr}T09:00:00+09:00`
        },
        end: {
          dateTime: `${todayStr}T10:00:00+09:00`
        },
        location: '회의실 A',
        attendees: [
          { email: 'team@example.com', displayName: '팀원들', responseStatus: 'accepted' }
        ],
        htmlLink: 'https://calendar.google.com'
      },
      {
        id: 'mock2',
        summary: '☕ 점심약속',
        description: '친구와 점심 식사\n\n맛집 탐방 계획입니다.',
        start: {
          dateTime: `${todayStr}T12:30:00+09:00`
        },
        end: {
          dateTime: `${todayStr}T14:00:00+09:00`
        },
        location: '강남역 맛집',
        htmlLink: 'https://calendar.google.com'
      },
      {
        id: 'mock3',
        summary: '💻 개발 작업',
        description: 'Google Calendar API 통합 작업\n\n- 오늘일정 기능 완성\n- UI/UX 개선\n- 테스트 및 디버깅',
        start: {
          dateTime: `${todayStr}T15:00:00+09:00`
        },
        end: {
          dateTime: `${todayStr}T18:00:00+09:00`
        },
        htmlLink: 'https://calendar.google.com'
      },
      {
        id: 'mock4',
        summary: '🎬 영화 관람',
        description: '',
        start: {
          dateTime: `${todayStr}T19:30:00+09:00`
        },
        end: {
          dateTime: `${todayStr}T21:30:00+09:00`
        },
        location: 'CGV 강남점',
        htmlLink: 'https://calendar.google.com'
      }
    ];
  }

  // 이벤트 시간 포맷팅
  formatEventTime(event: CalendarEvent): string {
    try {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      
      if (!start) return '시간 미정';
      
      // 종일 이벤트인 경우
      if (event.start.date && event.end.date) {
        return '종일';
      }
      
      // 시간이 있는 이벤트인 경우
      if (start && end) {
        const startTime = new Date(start).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const endTime = new Date(end).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        return `${startTime} - ${endTime}`;
      }
      
      return '시간 미정';
    } catch (error) {
      console.error('시간 포맷팅 실패:', error);
      return '시간 미정';
    }
  }

  // 사용자 정보 가져오기 (Google Identity Services)
  getUserInfo(): any {
    // API 키가 없으면 목업 사용자 정보 반환
    if (!import.meta.env.VITE_GOOGLE_API_KEY || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      return {
        email: 'user@gmail.com',
        name: '데모 사용자',
        imageUrl: 'https://via.placeholder.com/40x40/4285f4/ffffff?text=📅'
      };
    }

    if (!this.isSignedIn) return null;
    
    // Google Identity Services에서는 기본적인 사용자 정보를 직접 제공하지 않으므로
    // 일반적인 정보를 반환합니다
    return {
      email: 'user@gmail.com',
      name: 'Google 사용자',
      imageUrl: 'https://via.placeholder.com/40x40/4285f4/ffffff?text=👤'
    };
  }
}

// 싱글톤 인스턴스
export const googleCalendarService = new GoogleCalendarService();

// 전역 타입 선언
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}