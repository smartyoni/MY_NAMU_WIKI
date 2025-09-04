# Google Calendar API 설정 가이드

Google Calendar API를 사용하여 오늘 일정을 표시하기 위한 설정 방법입니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 Calendar API 활성화
1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. "Google Calendar API" 검색
3. "Google Calendar API" 클릭 → "사용" 버튼 클릭

### 1.3 사용자 인증 정보 생성

#### API 키 생성
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "사용자 인증 정보 만들기" → "API 키" 선택
3. 생성된 API 키를 복사해두세요

#### OAuth 2.0 클라이언트 ID 생성
1. "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
2. 애플리케이션 유형: "웹 애플리케이션" 선택
3. 이름: "Namuwiki App" (또는 원하는 이름)
4. 승인된 JavaScript 출처에 다음 추가:
   - `http://localhost:5173` (개발 서버)
   - `https://yourdomain.com` (배포된 도메인이 있다면)
5. 생성된 클라이언트 ID를 복사해두세요

### 1.4 OAuth 동의 화면 설정
1. 좌측 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
2. 사용자 유형: "외부" 선택 (개인 프로젝트인 경우)
3. 앱 정보 입력:
   - 앱 이름: "Personal Wiki"
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. 범위 추가:
   - "범위 추가 또는 삭제" 클릭
   - "https://www.googleapis.com/auth/calendar.readonly" 추가
5. 테스트 사용자 추가 (필요시):
   - 본인 Gmail 계정 추가

## 2. 환경변수 설정

### 2.1 .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 기존 Firebase 설정은 그대로 유지

# Google Calendar API Configuration
VITE_GOOGLE_API_KEY=여기에_API_키_입력
VITE_GOOGLE_CLIENT_ID=여기에_클라이언트_ID_입력
```

### 2.2 .gitignore 확인
`.env` 파일이 `.gitignore`에 포함되어 있는지 확인하세요:

```
.env
```

## 3. 사용법

1. 앱을 실행하고 "📅 오늘일정" 버튼을 클릭
2. "Google 계정으로 로그인" 버튼 클릭
3. Google 계정 선택 및 권한 승인
4. 오늘 일정이 자동으로 표시됩니다

## 4. 주의사항

- API 키와 클라이언트 ID는 절대 GitHub 등 공개 저장소에 업로드하지 마세요
- OAuth 동의 화면이 "게시" 상태가 아니면 테스트 사용자만 로그인 가능합니다
- API 사용량 제한이 있으니 필요에 따라 할당량을 확인하세요

## 5. 트러블슈팅

### "This app isn't verified" 경고
- 개발 중에는 정상적인 현상입니다
- "Advanced" → "Go to [앱이름] (unsafe)" 클릭하여 진행

### 로그인이 안되는 경우
1. OAuth 클라이언트 ID의 승인된 JavaScript 출처 확인
2. 브라우저 쿠키/캐시 삭제 후 재시도
3. 개발자 도구 콘솔에서 오류 메시지 확인

### 일정이 표시되지 않는 경우
1. Calendar API가 활성화되었는지 확인
2. API 키가 올바른지 확인
3. Google 계정에 캘린더 일정이 있는지 확인