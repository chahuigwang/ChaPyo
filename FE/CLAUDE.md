# Project: EnjoyTrip (AI-Powered Travel Planner)

## 1. Context & Goal
- [cite_start]**Project Name:** 공공데이터를 활용한 EnjoyTrip 서비스 [cite: 7, 18]
- [cite_start]**Target:** 한국관광공사 API 기반 지역 관광 정보 제공 및 AI 기반 일정 플래너 [cite: 66, 67]
- [cite_start]**Key UI:** - Left Sidebar: AI 페르소나와 대화하며 장소/숙소/식당을 추천받고 수정하는 공간[cite: 62, 142].
    - [cite_start]Right Workspace: 일자별 일정 카드를 편집하고 관리하는 메인 영역[cite: 64, 79].

## 2. Tech Stack (Strict)
- [cite_start]**Frontend:** Vue 3 (Composition API), Vite, Tailwind CSS[cite: 57, 58].
- **State Management:** Pinia (State 중심 설계).
- **Icons:** Lucide-vue-next.
- [cite_start]**Backend:** Java Spring Boot (REST API 연동 예정)[cite: 8].

## 3. Object-Oriented & Clean Architecture Principles
코드 생성 시 다음의 객체 지향 원칙을 준수할 것:
- **Single Responsibility (SRP):** 각 Vue 컴포넌트는 오직 하나의 UI 역할만 담당한다.
- **Domain-Driven Design:** `Trip`, `Itinerary`, `Persona`, `Place`와 같은 데이터는 각각의 Interface/Class로 정의하여 관리한다.
- **Modularization:** 비즈니스 로직은 컴포넌트에서 분리하여 `composable` (useTrip.js 등) 또는 `store` (Pinia)에서 처리한다.
- **Reusability:** 버튼, 입력창, 카드 등 공통 UI는 `components/common` 폴더에 원자 단위로 생성한다.

## 4. Component Hierarchy
1. `App.vue`: Main Entry & Layout Provider.
2. [cite_start]`SidebarContainer.vue`: AI Chat & Persona Logic[cite: 142].
3. [cite_start]`WorkspaceContainer.vue`: Date Picker & Daily Itinerary List[cite: 79, 87].
4. `Common/`: Button, Modal, Input components.

## 5. Token Saving Rules (Critical)
- **Minimalism:** 코드를 작성할 때 주석은 핵심 로직에만 달고, 불필요한 서술적 답변은 생략한다.
- **Partial Updates:** 기존 코드를 수정할 때는 변경되지 않은 부분은 `// ... existing code`로 생략하고 수정된 부분만 명시한다.
- [cite_start]**Mock Data First:** 백엔드 API 연동 전까지는 명세서의 요구사항(F01~F10)에 기반한 Mock JSON 데이터를 사용하여 UI를 먼저 완성한다[cite: 79].

## 6. Development Roadmap
- Phase 1: 기본 레이아웃 및 Tailwind 테마 설정.
- Phase 2: 사이드바 AI 채팅 UI 및 페르소나 전환 로직.
- Phase 3: 메인 워크스페이스의 일정 카드 CRUD 및 날짜 선택 기능.
- Phase 4: Pinia를 통한 사이드바-워크스페이스 간 데이터 동기화.
- Phase 5: 분할(메인 페이지에서 로그인 안 한 상태면 서비스 소개글이 보이고, 로그인 버튼을 누르면 로그인 모달이 표시되고, 로그인 성공하면 서비스 소개글 대신 나의 여행 계획들 여러가지를 보여주게 한 다음에, 해당 여행 계획을 클릭하면 이제 날짜별로 자세하게 수정하고 확인할 수 있게)
- Phase 6: 1. 로그아웃 안 했으면 옆에 사이드 바 안보이게, 2. index 페이지 중앙 정렬(가로 세로) 3. 여행 상세정보 페이지에서, 직관적으로 구현할 생각이라 상단(좌, 중앙)에는 달력이 보이게 해줘, 우측 상단에는 여행의 토탈 정보들(총 금액이나 숙소 등)하단에는 이제 그 날짜에 맞는 여행 정보를 보여줄 건데 여행 정보를 지금은 세로로 쌓고 있는데 가로로 시간 순서대로 보여줄 생각이야. 클릭하면 다양한 상세 정보를 볼 수 있게
- Phase 7: 아래의 세부 요구사항
1. 달력이 너무 크다. 크기를 절반~절반보다 살짝 크게 잡아줘.
2. 요약이 조금 텅 비어있는것 같은데 필요할 것 같은 요약들 넣어줘
3. ui를 shadcn-vue를 사용해서 구성해줘
4. 색상 조합은 #00B7EB를 핵심(5) 로 하는 70 : 25 : 5 로 해서 색상도 잡아줘. 이거 쉽게 수정할 수 있게 객체 지향적으로 만드는 것도 잊지 말고
5. AI랑 채팅을 통해서 해당 일정 양식을 주고 을 해당 날짜에 추가할 수 있게도 만들어줘.
- Phase 8: 아래의 세부 요구사항
1. 슬래시 명령으로 직접 일정 추가가 아니라, 채팅을 해서 AI가 응답으로 아이템 카드를 만들어주면, 그 카드를 클릭하면 그 날의 일정에 추가되는 기능
2. 달력의 가로 길이가 너무 길어. 좀 줄여줄래?
3. 페이지에 지도도 추가해야되는데 적당히 추가해줘
4. UI 구조를 딱딱 떨어지게 만들어줘

- Phase 9: 