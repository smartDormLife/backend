# 슬기로운 긱사생활 (Backend)

![슬기로운 긱사생활 배너](./assets/banner.png)

슬기로운 긱사생활은 기숙사생들이 배달, 공구, 택시 등 생활 목적에 맞는 파티를 모집하고, 모집 완료 후 자동 생성되는 채팅방에서 실시간으로 소통할 수 있는 기숙사 커뮤니티 플랫폼의 Backend Repository입니다.

Node.js와 Express를 기반으로 게시글, 파티 모집, 파티 참여, 채팅방 생성 흐름을 구현했으며, MySQL과 Prisma를 활용해 기숙사 생활 도메인에 맞는 데이터 구조를 설계하는 데 초점을 맞췄습니다.

<br/>

## 🛠️ Tech Stack

![node](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![express](https://img.shields.io/badge/Express-000000?style=for-the-badge\&logo=express\&logoColor=white)
![js](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)
![mysql](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge\&logo=mysql\&logoColor=white)
![prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge\&logo=prisma\&logoColor=white)
![socketio](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge\&logo=socketdotio\&logoColor=white)
![jwt](https://img.shields.io/badge/JWT-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)

<br/>

## 🏁 Getting Started

### Environment Setup

`.env` 파일을 생성하고 환경 변수를 설정해주세요.

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
JWT_SECRET="your_jwt_secret"
PORT=3000
```

### Requirements & Run

* Node.js
* MySQL
* Prisma

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

<br/>

## 🏗️ 프로젝트 구조

* REST API 기반 백엔드 서버
* Prisma ORM을 활용한 MySQL 데이터 관리
* 게시글과 파티 모집 정보를 분리한 도메인 구조
* 파티 모집 완료 시 채팅방 자동 생성
* Socket.io 기반 실시간 채팅 기능
* Router → Controller → Service → Repository 계층 분리

<details>
<summary><h3>디렉토리 구조</h3></summary>

```text
dormitory-community-backend/
├── package.json
├── server.js
├── prisma/
│   └── schema.prisma
│
└── src/
    ├── app.js
    ├── routes/
    │   ├── auth.router.js
    │   ├── post.router.js
    │   ├── party.router.js
    │   ├── comment.router.js
    │   └── chat.router.js
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── post.controller.js
    │   ├── party.controller.js
    │   ├── comment.controller.js
    │   └── chat.controller.js
    │
    ├── services/
    │   ├── auth.service.js
    │   ├── post.service.js
    │   ├── party.service.js
    │   ├── comment.service.js
    │   └── chat.service.js
    │
    ├── repositories/
    │   ├── user.repository.js
    │   ├── post.repository.js
    │   ├── party.repository.js
    │   ├── party-member.repository.js
    │   ├── chat-room.repository.js
    │   └── chat-message.repository.js
    │
    ├── middlewares/
    │   ├── auth.middleware.js
    │   └── error-handler.middleware.js
    │
    └── socket/
        └── socket.js
```

</details>

<br/>

### Service Architecture

![Service Architecture](./assets/system_architecture.png)

### ERD

![ERD](./assets/ERD.png)

<br/>

## 🧰 기술적 특징

<details>
<summary><h3>1. 게시글과 파티 모집 데이터 연결 구조 설계</h3></summary>

슬기로운 긱사생활은 단순 게시판 서비스가 아니라, 게시글 작성과 동시에 파티 모집 정보가 함께 생성되어야 하는 서비스입니다.

이를 위해 POST와 PARTY를 분리하고, post_id를 기준으로 두 데이터를 연결하는 구조로 설계했습니다.

### 문제 상황

게시글과 파티 모집 정보를 하나의 테이블에 모두 저장하면 일반 게시글과 모집 게시글을 구분하기 어렵고, 모집 인원, 약속 시간, 장소, 모집 상태처럼 파티에만 필요한 데이터가 게시글 구조에 강하게 결합되는 문제가 있었습니다.

### 해결 방안

POST는 제목, 내용, 카테고리, 작성자 등 게시글의 기본 정보를 담당하고, PARTY는 모집 인원, 현재 인원, 약속 시간, 장소, 모집 상태 등 파티 모집에 필요한 정보를 담당하도록 분리했습니다.

```mermaid
erDiagram
    USER ||--o{ POST : writes
    POST ||--|| PARTY : has
    PARTY ||--o{ PARTY_MEMBER : includes
    USER ||--o{ PARTY_MEMBER : joins

    USER {
        int user_id
        string email
        string password
        string name
        int dorm_id
    }

    POST {
        int post_id
        int user_id
        string category
        string title
        string content
        string status
        datetime created_at
    }

    PARTY {
        int party_id
        int post_id
        string location
        datetime deadline
        int max_member
        int current_member
        string status
    }

    PARTY_MEMBER {
        int party_id
        int user_id
        datetime joined_at
        string payment_status
    }
```

### 결과

사용자는 하나의 상세 페이지에서 게시글 내용과 파티 모집 정보를 함께 확인할 수 있고, 백엔드에서는 게시글 데이터와 모집 데이터를 역할에 따라 분리해 관리할 수 있게 되었습니다.

</details>

<details>
<summary><h3>2. 파티 참여 인원 관리와 상태 자동 변경</h3></summary>

파티 참여 기능에서는 사용자의 중복 참여를 막고, 현재 참여 인원과 최대 모집 인원을 비교하여 모집 완료 상태를 자동으로 변경해야 했습니다.

### 문제 상황

파티 참여자가 늘어날 때마다 관리자가 직접 모집 완료 여부를 수정하는 방식은 비효율적입니다. 또한 같은 사용자가 동일한 파티에 중복 참여할 경우 모집 인원 계산이 잘못될 수 있습니다.

### 해결 방안

사용자가 파티에 참여하면 PARTY_MEMBER 테이블에 참여 정보를 저장하고, 현재 참여 인원을 계산한 뒤 최대 모집 인원에 도달하면 PARTY 상태를 자동으로 모집 완료로 변경하도록 구현했습니다.

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant API as API Server
    participant DB as MySQL

    Client->>API: 1. 파티 참여 요청
    API->>DB: 2. 기존 참여 여부 조회

    alt 이미 참여한 사용자
        API-->>Client: 3. 중복 참여 에러 반환
    else 참여 가능
        API->>DB: 4. PartyMember 생성
        API->>DB: 5. 현재 참여 인원 조회
        API->>DB: 6. 최대 모집 인원과 비교

        alt 모집 인원 충족
            API->>DB: 7. PARTY 상태 모집 완료로 변경
        end

        API-->>Client: 8. 파티 참여 성공 응답
    end
```

### 결과

파티 참여 이후 모집 상태가 서비스 흐름에 맞게 자동으로 변경되도록 구현했으며, 사용자가 직접 상태를 관리하지 않아도 모집 과정이 자연스럽게 이어지도록 만들었습니다.

</details>

<details>
<summary><h3>3. 화면 흐름에 맞는 API 응답 구조 설계</h3></summary>

메인페이지와 상세 페이지에서는 여러 테이블의 데이터가 함께 필요했습니다.

프론트엔드에서 여러 API를 반복 호출하지 않도록, 화면에서 필요한 데이터를 기준으로 API 응답 구조를 설계했습니다.

### 문제 상황

상세 페이지에서는 게시글 정보만 필요한 것이 아니라, 파티 모집 정보, 현재 참여 인원, 사용자의 참여 여부, 댓글 정보가 함께 필요했습니다. 이를 각각의 API로 따로 호출하면 프론트엔드 로직이 복잡해지고 화면 렌더링 과정에서 불필요한 요청이 늘어날 수 있었습니다.

### 해결 방안

상세 페이지 API에서 게시글 정보, 파티 정보, 사용자 참여 여부를 함께 반환하도록 응답 구조를 구성했습니다.

```json
{
  "post": {
    "postId": 1,
    "title": "택시 같이 타실 분 구합니다",
    "content": "밤 10시에 학교 정문에서 출발합니다.",
    "category": "taxi",
    "createdAt": "2025-06-01T12:00:00.000Z"
  },
  "party": {
    "partyId": 1,
    "location": "학교 정문",
    "deadline": "2025-06-01T22:00:00.000Z",
    "maxMember": 4,
    "currentMember": 3,
    "status": "RECRUITING"
  },
  "isJoined": false,
  "comments": [
    {
      "commentId": 1,
      "content": "저 참여하고 싶어요.",
      "createdAt": "2025-06-01T12:10:00.000Z"
    }
  ]
}
```

### 결과

프론트엔드는 하나의 상세 페이지 API 응답만으로 게시글, 파티 모집 정보, 참여 여부를 렌더링할 수 있게 되었고, 화면 흐름에 맞는 데이터 전달 구조를 만들 수 있었습니다.

</details>

<details>
<summary><h3>4. 파티 모집 완료 후 채팅방 자동 생성</h3></summary>

파티 모집이 완료되면 참여자들이 바로 소통할 수 있어야 했습니다.

이를 위해 PARTY, PARTY_MEMBER, CHATROOM, CHATMEMBER 데이터를 연결하여 모집 완료 이후 채팅방이 자동 생성되고, 파티 참여자들이 채팅방에 연결되는 흐름을 구현했습니다.

### 문제 상황

기존 학교 커뮤니티에서는 모집이 완료된 이후 별도의 오픈채팅방을 만들어야 했습니다. 이 과정에서 링크 공유, 참여자 확인, 입장 관리가 따로 필요해 사용 흐름이 끊기는 문제가 있었습니다.

### 해결 방안

파티 모집 인원이 충족되면 PARTY 상태를 모집 완료로 변경하고, 해당 PARTY와 연결된 CHATROOM을 생성했습니다. 이후 PARTY_MEMBER에 저장된 참여자들을 CHATMEMBER로 등록하여 채팅방 참여자로 연결했습니다.

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant API as API Server
    participant DB as MySQL
    participant Socket as Socket.io

    Client->>API: 1. 파티 참여 요청
    API->>DB: 2. PartyMember 생성
    API->>DB: 3. 현재 인원 확인

    alt 모집 인원 충족
        API->>DB: 4. PARTY 상태 모집 완료 변경
        API->>DB: 5. ChatRoom 생성
        API->>DB: 6. PartyMember 목록 조회
        API->>DB: 7. ChatMember 생성
    end

    Client->>Socket: 8. 채팅방 접속
    Socket-->>Client: 9. 실시간 메시지 송수신
```

### 결과

사용자는 별도의 외부 채팅방을 만들 필요 없이, 파티 모집 완료 후 서비스 내부에서 바로 실시간 채팅을 사용할 수 있게 되었습니다.

</details>

<details>
<summary><h3>5. Socket.io 기반 실시간 채팅 구현</h3></summary>

파티 참여자들이 모집 완료 이후 약속 시간, 장소, 비용 정산 등을 실시간으로 논의할 수 있도록 Socket.io 기반 채팅 기능을 구현했습니다.

### 주요 흐름

1. 사용자가 채팅방에 입장합니다.
2. 서버는 사용자를 해당 room에 join 처리합니다.
3. 사용자가 메시지를 전송하면 서버는 CHATMESSAGE에 메시지를 저장합니다.
4. 같은 room에 접속한 참여자들에게 메시지를 실시간으로 전달합니다.

```mermaid
sequenceDiagram
    participant UserA as 사용자 A
    participant Socket as Socket.io Server
    participant DB as MySQL
    participant UserB as 사용자 B

    UserA->>Socket: 1. 채팅방 입장
    Socket->>Socket: 2. room join

    UserA->>Socket: 3. 메시지 전송
    Socket->>DB: 4. ChatMessage 저장
    Socket-->>UserB: 5. 같은 room 참여자에게 메시지 전달
```

### 결과

파티 참여자들은 모집 완료 이후 서비스 내부에서 실시간으로 소통할 수 있으며, 채팅 메시지는 DB에 저장되어 이후에도 대화 내용을 확인할 수 있습니다.

</details>

<br/>

## 🧩 주요 API

### Auth

| Method | URL            | 설명   |
| ------ | -------------- | ---- |
| POST   | /auth/register | 회원가입 |
| POST   | /auth/login    | 로그인  |

### Post

| Method | URL            | 설명                |
| ------ | -------------- | ----------------- |
| GET    | /posts         | 게시글 목록 조회         |
| GET    | /posts/:postId | 게시글 상세 조회         |
| POST   | /posts         | 게시글 및 파티 모집 정보 생성 |
| PATCH  | /posts/:postId | 게시글 수정            |
| DELETE | /posts/:postId | 게시글 삭제            |

### Party

| Method | URL                       | 설명        |
| ------ | ------------------------- | --------- |
| POST   | /parties/:partyId/join    | 파티 참여     |
| DELETE | /parties/:partyId/leave   | 파티 참여 취소  |
| GET    | /parties/:partyId/members | 파티 참여자 조회 |

### Comment

| Method | URL                     | 설명    |
| ------ | ----------------------- | ----- |
| POST   | /posts/:postId/comments | 댓글 작성 |
| GET    | /posts/:postId/comments | 댓글 조회 |
| DELETE | /comments/:commentId    | 댓글 삭제 |

### Chat

| Method | URL                         | 설명          |
| ------ | --------------------------- | ----------- |
| GET    | /chatrooms                  | 내 채팅방 목록 조회 |
| GET    | /chatrooms/:roomId/messages | 채팅 메시지 조회   |

<br/>

## 🧩 라이브러리 사용

| 라이브러리          | 용도                 |
| -------------- | ------------------ |
| express        | Node.js 기반 웹 프레임워크 |
| @prisma/client | MySQL 데이터베이스 ORM   |
| socket.io      | 실시간 채팅 기능 구현       |
| jsonwebtoken   | JWT 기반 사용자 인증      |
| bcrypt         | 비밀번호 해싱            |
| cors           | CORS 처리            |
| dotenv         | 환경변수 관리            |
| axios          | API 요청 처리          |
| nodemon        | 개발 환경 서버 자동 재시작    |

<br/>
