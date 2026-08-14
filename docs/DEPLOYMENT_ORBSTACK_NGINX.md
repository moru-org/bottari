# OrbStack (Docker) & Nginx 리버스 프록시 연동 가이드

본 문서는 **M1 Max Workstation (192.168.0.8)**에서 OrbStack으로 BOTTARI 애플리케이션 컨테이너를 구동하고, **Mac mini (192.168.0.5)**의 Nginx를 통해 외부 클라우드 도메인 트래픽을 안전하게 포워딩하는 가이드입니다.

---

## 1. 네트워크 및 트래픽 아키텍처

```text
[인터넷 / 외부 클라우드 도메인]
           │
           │ HTTPS (포트 443 / 80)
           ▼
[Mac mini (192.168.0.5) - Nginx]
           │
           │ LAN Reverse Proxy (http://192.168.0.8:3000)
           ▼
[M1 Max (192.168.0.8) - OrbStack Docker]
           │
           │ 0.0.0.0:3000 바인딩
           ▼
[BOTTARI Next.js 15 컨테이너] ──> [SQLite DB: /app/prisma/data/dev.db]
```

---

## 2. M1 Max (192.168.0.8) — OrbStack 컨테이너 구동

### 2.1 사전 확인
- OrbStack이 구동 중인지 확인합니다.
- 데이터 저장소 디렉토리를 생성합니다:
  ```bash
  mkdir -p prisma/data
  ```

### 2.2 Docker Compose 빌드 및 실행
```bash
# 컨테이너 빌드 및 백그라운드 구동
docker compose up -d --build

# 구동 로그 확인
docker compose logs -f
```

### 2.3 로컬 및 바인딩 상태 확인
```bash
# 1) 로컬 루프백 테스트
curl -I http://localhost:3000

# 2) M1 Max IP 바인딩 테스트
curl -I http://192.168.0.8:3000
```

> [!NOTE]
> `0.0.0.0:3000:3000`으로 바인딩되어 있으므로 LAN 내의 다른 기기(Mac mini 192.168.0.5)에서 192.168.0.8:3000으로 직접 HTTP 통신이 가능합니다.

---

## 3. Mac mini (192.168.0.5) — Nginx 설정 및 적용

### 3.1 네트워크 통신 확인 (Mac mini 터미널에서)
M1 Max 컨테이너가 정상 작동하는지 Mac mini에서 먼저 확인합니다:
```bash
curl -I http://192.168.0.8:3000
```
HTTP 200 또는 리다이렉트 응답이 오면 연결 준비 완료입니다.

### 3.2 Nginx 설정 파일 배치
프로젝트에 포함된 `nginx/bottari.conf` 파일을 Mac mini의 Nginx 설정 디렉토리에 복사합니다:
```bash
# (Mac mini 서버에서 실행)
sudo cp /srv/moru-org/bottari/nginx/bottari.conf /etc/nginx/sites-available/bottari.conf
sudo ln -s /etc/nginx/sites-available/bottari.conf /etc/nginx/sites-enabled/
```
*도메인명(`bottari.yourdomain.com`)과 SSL 인증서 경로는 실제 환경에 맞게 수정합니다.*

### 3.3 Nginx 문법 검사 및 재시작
```bash
sudo nginx -t
sudo systemctl reload nginx   # 또는 sudo brew services reload nginx / nginx -s reload
```

---

## 4. 환경 변수 설정 (.env)

도메인 또는 외부 접속 URL에 맞춰 M1 Max의 `.env` 파일을 조정합니다:
```env
# 외부 접속 도메인 (카카오톡 공유 및 링크 생성의 베이스 URL)
NEXT_PUBLIC_APP_URL="https://bottari.yourdomain.com"

# 인증 암호화 시크릿 키
AUTH_SECRET="bottari_super_secure_random_session_secret_key_2026"
```

---

## 5. 문제 해결 및 점검 (Troubleshooting)

### Q1. Mac mini에서 M1 Max(192.168.0.8:3000)로 접속되지 않는 경우 (`Connection refused` 또는 타임아웃)
1. **macOS 방화벽 확인**:
   - `시스템 설정` > `네트워크` > `방화벽`에서 OrbStack 또는 들어오는 연결이 차단되지 않았는지 확인합니다.
2. **OrbStack 네트워크 설정**:
   - OrbStack 설정에서 `Network` 모드가 정상 활성화되어 있는지 확인합니다.
3. **포트 충돌 확인**:
   - M1 Max에서 `lsof -i :3000`으로 3000번 포트를 다른 프로세스가 점유하고 있는지 확인합니다.

### Q2. Next.js 이미지 및 정적 파일이 깨질 때
- `nginx/bottari.conf`의 `location /_next/static/` 캐싱 및 프록시 헤더(`Host`, `X-Forwarded-Proto`)가 정상 적용되었는지 확인합니다.
