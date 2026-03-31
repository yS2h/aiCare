# 🧠 aiCare  
### 인공지능 기반 스마트 정밀 케어 플랫폼
* (주)신라시스템 협업 프로젝트 
> 의료 데이터를 기반으로 아이의 성장과 체형을 분석·예측하는 AI 스마트 케어 플랫폼

---

## 📌 프로젝트 소개

**aiCare**는  
아이의 성장 데이터(키, 몸무게, BMI)와 이미지(손 뼈, 척추)를 기반으로  
AI 분석을 통해 성장 예측 및 맞춤형 관리 가이드를 제공하는 플랫폼입니다.

부모는 모바일 웹에서 건강 데이터를 쉽게 기록·조회할 수 있으며,  
의사는 웹 대시보드를 통해 환자군을 모니터링하고 의사결정을 지원받을 수 있는  
**양방향 스마트 케어 시스템**입니다.

또한 GPT 기반 AI 상담 기능을 통해  
부모가 직관적으로 이해할 수 있는 맞춤형 가이드를 제공합니다.

---

## 👥 팀 구성

| 이름 | 역할 |
|------|------|
| 권재영 | FE 개발 |
| 배민중 | FE 개발 |
| 윤수현 | BE 개발 |

---

## 🛠️ 기술 스택 
* **Frontend**: React, TypeScript
* **Backend / Deployment**: Node.js, Render, Kakao OAuth 2.0, GPT API 
* **Collaboration tool**: Notion, GitHub

<img width="982" height="1000" alt="image" src="https://github.com/user-attachments/assets/a2b85355-9873-4ea0-87d9-583190b257ca" />

---


## ✨ 핵심 기능

### 1️⃣ 메인 화면 – 성장 추이 분석

<img width="603" height="1091" alt="image" src="https://github.com/user-attachments/assets/38494c87-fa5d-4aeb-8748-a8ac6aedba4f" />

- 최근 성장 추이 그래프 제공
- 키 / 몸무게 / BMI 추세 시각화
- 맞춤형 종합 성장 분석 정보 제공
- 권장 관리 정보 안내

---

### 2️⃣ 성장 이력 관리

<img width="585" height="1134" alt="image" src="https://github.com/user-attachments/assets/dcb01620-de6d-4aab-aafc-35f3337fe140" />

- 성장 데이터 입력 (키, 몸무게, 특이사항)
- 키·몸무게 예측 그래프 제공
- 날짜별 이력 조회
- 잘못 입력한 데이터 삭제 가능
- 10개 단위 페이징 처리

---

### 3️⃣ 골연령 및 체형 분석

<img width="635" height="1099" alt="image" src="https://github.com/user-attachments/assets/1250956c-69d9-4dfa-ae9e-d00eeebeb345" />

- 손 뼈 사진 업로드
- 수부 골연령 예측 결과 제공
- 척추 체형 분석
- Cobb’s angle, Apex, 휨 방향 분석 제공
- 촬영 날짜별 기록 관리

---

### 4️⃣ 종합 성장 가이드 PDF 생성

<img width="567" height="1064" alt="image" src="https://github.com/user-attachments/assets/fe84f568-453f-475e-aa1e-05ad2df90e45" />

- aiCare 분석 결과를 PDF로 저장
- 아이 기본 정보 (이름, 성별, 나이)
- 키·몸무게·BMI 데이터
- 성장 추이 그래프
- 골연령 및 체형 분석 결과
- 맞춤형 관리 추천 사항 포함

---

### 5️⃣ AI 맞춤 상담

<img width="619" height="1118" alt="image" src="https://github.com/user-attachments/assets/5e4f7283-56dc-410b-9d5e-4d1dd2efb285" />

- GPT 연동 상담 기능
- 백엔드단에서 상담 챗봇 프롬프팅 마침 
- 아이 성장 데이터 기반 맞춤 응답
- 향후 RAG 기반 맞춤형 의료 상담 시스템으로 확장 가능

---

## 트러블 슈팅 과정
인증 방식 불일치 해결을 통한 아키텍처 정합성 확보
1. 배경
신규 기능 개발 중 특정 API 호출 시 권한 문제(401 Unauthorized)가 발생했습니다 동일한 사용자 세션임에도 불구하고 API 라우트별로 인증 처리 방식이 상이하여 프론트엔드 개발에 혼선이 발생한 상황이었습니다

2. 문제 상황 
현상: /auth/me (사용자 정보 조회) API는 정상 동작(200 OK)하나, /children/{id}/growth (데이터 생성) API는 401 Unauthorized 에러와 함께 Missing bearer token 메시지 출력

원인 분석: * /auth/me: 쿠키(Cookie) 기반의 세션 인증 방식을 사용 중
/children/.../growth: 헤더(Header)에 담기는 Bearer 토큰(JWT) 필수 인증 방식

리스크: 동일 서비스 내에서 인증 방식이 이원화되어 있을 경우, FE에서는 쿠키 관리와 토큰 관리를 동시에 수행해야 하며, 이는 보안 취약점 노출 및 코드 복잡도 증가의 원인이 됨

3. 해결 전략: 백엔드 정합성 맞추기 (Backend Consistency)
단순히 FE에서 토큰을 넘겨주는 임시방편(Patch) 대신, 시스템의 일관성을 위해 백엔드 구조 수정을 제안했습니다

Option A: 인증 프로토콜 단일화 (권장)
내용: 모든 API가 세션 쿠키를 공유하도록 백엔드 라우터 보안 설정을 수정

장점: FE에서 추가적인 토큰 저장 로직(localStorage 등)이 필요 없어지며, 보안적인 측면에서 관리가 일원화됨

Option B: 토큰 획득 경로 일원화
내용: 쿠키 인증 후, FE에서 Bearer 토큰을 안전하게 획득할 수 있는 엔드포인트 마련(예: /auth/me 응답 객체에 토큰 포함).

장점: 기존 토큰 기반 API 구조를 유지하면서도 인증 흐름을 매끄럽게 연결 가능

Communication: 백엔드 팀에 인증 방식 불일치로 인한 FE 개발 비용 증가 문제를 공유하고, 정합성을 맞추는 방향으로 논의 진행

---

## 📈 완성도 및 향후 개선 방향

- RAG 기반 전문 의료 데이터 결합
- AI 모델 정밀도 개선
- 사용자별 성장 예측 정확도 향상
- 의료진 전용 분석 리포트 고도화
- 대용량 데이터 처리 최적화

---


