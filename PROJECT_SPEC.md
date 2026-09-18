# BusinessFlow — Project Specification

> Główna instrukcja implementacyjna dla Agenta AI GPT-5.6 Sol pracującego w Visual Studio Code.

> **Status:** zakres funkcjonalny MVP jest ukończony. Pozostały końcowa weryfikacja, manual QA i finalizacja repozytorium opisana w etapach 20, 21 i 23.

## 1. Cel dokumentu

Agent ma samodzielnie zaprojektować, zaimplementować, przetestować, uruchomić i przygotować do publikacji kompletną aplikację webową **BusinessFlow** zgodnie z niniejszą specyfikacją.

Jeżeli drobna kwestia techniczna nie została opisana wprost, Agent ma:

1. wybrać najprostsze rozwiązanie zgodne z istniejącą architekturą,
2. preferować bezpieczeństwo, czytelność i maintainability,
3. nie rozszerzać niepotrzebnie zakresu MVP,
4. zachować spójność UI, modelu danych i permissions,
5. dokumentować istotne decyzje architektoniczne w README lub krótkich komentarzach tam, gdzie są naprawdę potrzebne.

Agent ma pracować autonomicznie. Nie powinien zatrzymywać implementacji z powodu drobnych niejasności — ma przyjąć rozsądne założenie zgodne z tym dokumentem.

---

# 2. Produkt

## 2.1. Nazwa

**BusinessFlow**

Nazwa jest robocza, ale ma być używana konsekwentnie w interfejsie, metadatach, README i kontach demo.

## 2.2. Charakter aplikacji

BusinessFlow to nowoczesna aplikacja B2B SaaS do zarządzania małą firmą usługową. Może odpowiadać potrzebom np. agencji marketingowej, małego software house'u, studia projektowego, firmy remontowej, instalacyjnej lub fotograficznej.

Aplikacja łączy podstawowe elementy:

- CRM,
- zarządzania klientami,
- zarządzania projektami,
- zarządzania zadaniami,
- prostego zarządzania zespołem,
- dashboardu operacyjnego,
- audytu zmian.

Główny przepływ biznesowy:

`Organization -> Client -> Project -> Tasks -> Completion`

Administrator dodaje klienta, tworzy dla niego projekt, przypisuje członków zespołu, tworzy zadania i śledzi realizację. Pracownik widzi przypisane projekty i wykonuje pracę głównie poprzez zadania oraz Kanban.

---

# 3. Cel portfolio

Projekt ma wyglądać jak rzeczywisty mały produkt SaaS, a nie tutorialowy CRUD.

Repozytorium powinno pokazywać umiejętności w zakresie:

- Next.js i React,
- TypeScript,
- nowoczesnego UI,
- projektowania relacyjnej bazy danych,
- ORM,
- uwierzytelniania,
- autoryzacji na poziomie zasobów,
- multi-tenancy,
- Server Components i Client Components,
- formularzy i walidacji,
- CRUD,
- filtrowania, wyszukiwania i paginacji,
- dashboardów i wykresów,
- drag & drop,
- systemu ról,
- Activity Log,
- testów jednostkowych, integracyjnych i E2E,
- bezpieczeństwa,
- Git/GitHub workflow.

---

# 4. Zakres MVP

## 4.1. Funkcje wymagane

Należy zaimplementować:

1. logowanie,
2. organizację użytkownika,
3. role `ADMIN` i `EMPLOYEE`,
4. multi-tenancy,
5. dashboard,
6. klientów,
7. projekty,
8. członków projektów,
9. zadania,
10. Kanban z drag & drop,
11. zespół,
12. Activity Log,
13. ustawienia profilu,
14. ustawienia organizacji,
15. dark mode,
16. responsywność,
17. seed realistycznych danych demo,
18. testy,
19. README,
20. pełny Git/GitHub workflow.

## 4.2. Poza zakresem MVP

Nie implementować:

- Stripe,
- billing/subscriptions,
- publicznej rejestracji,
- OAuth,
- zaproszeń e-mailowych do organizacji,
- systemu resetu hasła,
- chatów,
- WebSocketów,
- realtime collaboration,
- powiadomień push,
- uploadu plików,
- S3/R2,
- panelu klienta z osobnym logowaniem,
- faktur,
- generowania PDF,
- rozbudowanego kalendarza,
- integracji Google Calendar,
- pełnego CRM sprzedażowego i lead pipeline,
- funkcji AI,
- aplikacji mobilnej,
- publicznego marketing landing page.

Pomysły te mogą trafić wyłącznie do sekcji `Future Improvements` w README.

---

# 5. Stack technologiczny

## 5.1. Framework i frontend

Użyć:

- Next.js z App Router,
- React,
- TypeScript z `strict: true`,
- Tailwind CSS,
- shadcn/ui,
- Lucide Icons.

Używać aktualnych stabilnych i wzajemnie kompatybilnych wersji.

Nie używać Pages Router.

## 5.2. Backend

Backend ma działać wewnątrz Next.js.

Preferować:

- Server Components do odczytu danych,
- Server Actions do formularzy i mutacji,
- Route Handlers tylko wtedy, gdy są uzasadnione technicznie.

Nie tworzyć osobnego backendu Express/NestJS.

## 5.3. Baza danych

Użyć:

- PostgreSQL,
- Prisma ORM.

Lokalny development ma korzystać z PostgreSQL uruchamianego przez `docker-compose.yml`.

## 5.4. Authentication

Użyć Auth.js / NextAuth z Credentials Provider.

W MVP nie ma publicznej rejestracji.

Hasła muszą być hashowane przez bezpieczny algorytm, np. bcrypt lub argon2.

Sesja musi zapewniać serwerowi dostęp do:

- `userId`,
- `organizationId`,
- `role`.

Nie ufać `organizationId`, `role` ani innym permissions przesyłanym przez frontend.

## 5.5. Formularze i walidacja

Użyć:

- React Hook Form,
- Zod.

Każda mutacja danych musi być walidowana po stronie serwera.

## 5.6. Dodatkowe biblioteki

Preferowane:

- TanStack Table — tabele,
- dnd-kit — Kanban,
- Recharts — wykresy,
- date-fns — daty,
- Sonner — toast notifications,
- next-themes — dark mode,
- Vitest — unit tests,
- Playwright — E2E.

Nie dodawać bibliotek, jeżeli istniejące zależności rozwiązują problem wystarczająco dobrze.

## 5.7. Package manager

Preferowany: `pnpm`.

---

# 6. Architektura

Aplikacja ma być modularnym monolitem Next.js. Nie stosować mikroserwisów.

Logika biznesowa nie powinna być zaszyta bezpośrednio w komponentach prezentacyjnych.

Preferowana struktura:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── clients/
│   ├── projects/
│   ├── tasks/
│   └── team/
├── features/
│   ├── clients/
│   ├── projects/
│   ├── tasks/
│   ├── organization/
│   └── activity/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── validations/
│   ├── utils/
│   └── constants/
├── hooks/
├── types/
└── middleware.ts

prisma/
├── schema.prisma
└── seed.ts
```

Agent może dostosować strukturę do aktualnych praktyk Next.js, ale musi zachować separację odpowiedzialności.

---

# 7. Multi-tenancy — wymaganie krytyczne

BusinessFlow obsługuje wiele organizacji.

Każdy rekord biznesowy musi należeć bezpośrednio lub pośrednio do organizacji.

Użytkownik organizacji A nigdy nie może:

- odczytać danych organizacji B,
- edytować danych organizacji B,
- usunąć danych organizacji B,
- uzyskać dostępu do danych B przez ręczną zmianę ID w URL lub payloadzie.

Każda operacja dotycząca zasobu organizacji musi uwzględniać `organizationId` bieżącej sesji.

Niebezpieczny wzorzec:

```ts
prisma.project.findUnique({
  where: { id: projectId }
})
```

jeśli później nie ma jednoznacznej weryfikacji organizacji.

Preferowany wzorzec:

```ts
prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId: session.organizationId,
  },
})
```

Analogicznie dla klientów, projektów, zadań, użytkowników zespołu i activity logs.

Przy próbie dostępu do zasobu innej organizacji preferować zachowanie typu `404`, aby nie ujawniać istnienia zasobu.

---

# 8. Role i permissions

## 8.1. `ADMIN`

Może:

- oglądać pełny dashboard organizacji,
- zarządzać klientami,
- zarządzać projektami,
- zarządzać członkami projektów,
- tworzyć i edytować wszystkie zadania,
- usuwać zadania,
- używać Kanbana,
- przeglądać zespół,
- przeglądać Activity Log,
- edytować organizację.

## 8.2. `EMPLOYEE`

Może:

- oglądać dashboard ograniczony do dostępnych projektów/zadań,
- widzieć projekty, do których jest przypisany,
- widzieć zadania z tych projektów,
- zmieniać status zadań, do których ma dostęp,
- używać Kanbana dla dostępnych zadań,
- widzieć zespół read-only,
- edytować swój profil.

Nie może:

- tworzyć ani usuwać klientów,
- tworzyć ani usuwać projektów,
- zarządzać organizacją,
- zarządzać rolami,
- wykonywać admin-only mutations.

Preferowany wariant dla MVP: `EMPLOYEE` może edytować w zadaniu tylko jego `status`; pozostałe pola kontroluje `ADMIN`.

Permissions muszą być egzekwowane po stronie serwera, nie tylko przez ukrywanie elementów UI.

---

# 9. Model danych

## 9.1. Organization

```text
id
name
slug
createdAt
updatedAt
```

Relacje: users, clients, projects, activityLogs.

## 9.2. User

```text
id
organizationId
name
email
passwordHash
role
avatarUrl nullable
jobTitle nullable
createdAt
updatedAt
```

Enum:

```text
ADMIN
EMPLOYEE
```

Email unikalny.

## 9.3. Client

```text
id
organizationId
name
email nullable
phone nullable
company nullable
address nullable
notes nullable
status
createdAt
updatedAt
```

Status:

```text
ACTIVE
INACTIVE
```

## 9.4. Project

```text
id
organizationId
clientId
name
description nullable
status
priority
budget nullable
startDate nullable
deadline nullable
createdAt
updatedAt
```

Status:

```text
PLANNING
IN_PROGRESS
ON_HOLD
COMPLETED
CANCELLED
```

Priority:

```text
LOW
MEDIUM
HIGH
```

## 9.5. ProjectMember

```text
id
projectId
userId
createdAt
```

Unikalność: `projectId + userId`.

## 9.6. Task

```text
id
organizationId
projectId
assigneeId nullable
title
description nullable
status
priority
deadline nullable
position
createdAt
updatedAt
```

Status:

```text
TODO
IN_PROGRESS
REVIEW
DONE
```

Priority:

```text
LOW
MEDIUM
HIGH
URGENT
```

`position` służy do trwałego porządku kart w Kanbanie.

## 9.7. ActivityLog

```text
id
organizationId
userId nullable
entityType
entityId nullable
action
description
metadata nullable
createdAt
```

Przykładowe `entityType`:

```text
CLIENT
PROJECT
TASK
USER
ORGANIZATION
```

Przykładowe `action`:

```text
CREATED
UPDATED
DELETED
STATUS_CHANGED
ASSIGNED
```

`metadata` może być JSON.

Nie implementować event sourcingu.

---

# 10. Relacje i onDelete

Preferowane:

- `Organization -> data`: technicznie Cascade może być dopuszczalne, ale UI nie udostępnia delete organization,
- `Client -> Project`: Restrict,
- `Project -> Task`: Cascade,
- `Project -> ProjectMember`: Cascade,
- `User -> Task.assignee`: SetNull,
- `User -> ActivityLog.user`: SetNull.

Usunięcie usera nie może usuwać historycznych logów.

---

# 11. Indeksy

Rozważyć co najmniej:

```text
Client.organizationId
Project.organizationId
Project.clientId
Project.status
Task.organizationId
Task.projectId
Task.assigneeId
Task.status
Task.deadline
ActivityLog.organizationId
ActivityLog.createdAt
ProjectMember.userId
```

Nie indeksować bez potrzeby każdego pola.

---

# 12. Seed danych

Seed musi utworzyć realistyczne demo.

Organizacja:

```text
Acme Creative Studio
```

Konta:

```text
admin@businessflow.local
employee@businessflow.local
```

Hasło developerskie:

```text
Demo123!
```

Hasła w bazie muszą być zahashowane.

Seed powinien stworzyć:

- minimum 8 klientów,
- minimum 8 projektów,
- minimum 20–30 zadań,
- projekty w różnych statusach,
- zadania w różnych statusach,
- przynajmniej 2 overdue tasks,
- kilka completed projects,
- ProjectMembers,
- Activity Logs.

Dane mają dobrze prezentować dashboard.

Przykładowi klienci:

```text
Nova Studio
Bright Agency
Pixel Corp
Northstar Labs
Studio Vertex
Orbit Media
Maven Works
Peak Digital
```

Przykładowe projekty:

```text
Website Redesign
Marketing Campaign
CRM Integration
Brand Identity
E-commerce Launch
SEO Campaign
Client Portal
Analytics Dashboard
```

Przykładowe zadania:

```text
Create landing page
Implement authentication
Prepare dashboard layout
Build client table
Review mobile navigation
Create campaign assets
Set up database schema
Configure analytics tracking
```

---

# 13. Routing

```text
/
├── /login
├── /dashboard
├── /clients
│   ├── /new
│   └── /[clientId]
├── /projects
│   ├── /new
│   └── /[projectId]
├── /tasks
├── /board
├── /team
├── /activity
└── /settings
    ├── /profile
    └── /organization
```

`/`:

- niezalogowany -> `/login`,
- zalogowany -> `/dashboard`.

Chronione route'y wymagają sesji.

---

# 14. Layout aplikacji

Po zalogowaniu aplikacja ma używać klasycznego SaaS dashboard layoutu.

Sidebar:

- BusinessFlow,
- Dashboard,
- Clients,
- Projects,
- Tasks,
- Board,
- Team,
- Activity,
- Settings.

Na dole:

- avatar/initials,
- nazwa użytkownika,
- rola,
- menu użytkownika,
- logout.

Header:

- tytuł aktualnej sekcji,
- opcjonalne breadcrumbs,
- theme switcher.

Mobile: sidebar jako `Sheet`/drawer.

---

# 15. Design system

Aplikacja ma wyglądać profesjonalnie i minimalistycznie, w stylu współczesnych produktów B2B SaaS.

Inspiracje kierunkowe:

- Linear,
- Vercel Dashboard,
- Notion.

Nie kopiować żadnego produktu 1:1.

Preferować:

- neutralne tło,
- subtelne borders,
- umiarkowany border-radius,
- delikatne shadows,
- czytelną typografię,
- jeden dominujący accent color,
- dużo whitespace.

Unikać:

- nadmiernych gradientów,
- glassmorphismu,
- neonów,
- przesadnych animacji,
- przypadkowej kolorystyki statusów.

Dark mode jest wymagany.

Pierwsza wizyta: respektowanie system preference. Następnie Light/Dark z zapisem preferencji lokalnie.

Interfejs i kod aplikacji mają być po angielsku.

---

# 16. Responsywność i accessibility

Aplikacja musi działać na:

- desktop,
- tablet,
- telefon.

Tabele na mobile mogą mieć horizontal scroll lub uproszczony układ kart.

Kanban na mobile może mieć horizontal scroll.

Minimum accessibility:

- semantic HTML,
- poprawne labels,
- keyboard navigation,
- focus states,
- `aria-label` dla icon buttons,
- odpowiedni contrast,
- accessible Dialog/AlertDialog,
- nie usuwać focus outline bez alternatywy.

---

# 17. Login

Route: `/login`.

UI:

- karta wycentrowana,
- logo BusinessFlow,
- email,
- password,
- Sign in.

Pokazać dane demo:

```text
Admin demo
admin@businessflow.local
Demo123!
```

Opcjonalnie dodać `Use Admin Demo` i `Use Employee Demo`, które wypełniają formularz.

Nie implementować Sign Up, OAuth, Forgot Password.

---

# 18. Dashboard

Route: `/dashboard`.

## 18.1. KPI

Minimum:

- Active Projects,
- Open Tasks,
- Overdue Tasks,
- Active Clients.

Definicje:

### Active Projects

Status w:

```text
PLANNING
IN_PROGRESS
ON_HOLD
```

### Open Tasks

`status != DONE`

### Overdue Tasks

`deadline < now && status != DONE`

### Active Clients

`status = ACTIVE`

Dane zawsze z bieżącej organizacji i zgodne z permissions użytkownika.

## 18.2. Wykres

Prosty wykres statusów projektów, preferowany bar chart.

## 18.3. Upcoming deadlines

Pokazać ok. 5 najbliższych deadline'ów z oznaczeniem overdue/upcoming.

## 18.4. Recent Activity

Pokazać ostatnie 8–10 Activity Logs.

---

# 19. Clients

Route: `/clients`.

Tabela:

```text
Client
Company
Email
Projects
Status
Created
Actions
```

Funkcje:

- search po name/company/email,
- filter status,
- pagination,
- Add Client.

Preferować URL search params:

```text
/clients?search=nova&status=ACTIVE&page=1
```

## 19.1. Create Client

`ADMIN` only.

Fields:

```text
name *
company
email
phone
address
notes
status
```

Default: `ACTIVE`.

Po utworzeniu:

- redirect do details,
- toast,
- Activity Log.

## 19.2. Client Details

Route: `/clients/[clientId]`.

Pokazać:

- name,
- status,
- contact information,
- company,
- address,
- notes,
- projekty klienta.

ADMIN: Edit/Delete.

Delete klienta jest zablokowane, jeżeli ma projekty.

---

# 20. Projects

Route: `/projects`.

Tabela:

```text
Project
Client
Status
Priority
Deadline
Progress
Team
Actions
```

Funkcje:

- search,
- filter status,
- filter priority,
- filter client,
- sort deadline,
- pagination.

ADMIN widzi wszystkie projekty organizacji. EMPLOYEE wyłącznie przypisane.

## 20.1. Create Project

ADMIN only.

Fields:

```text
name *
client *
description
status
priority
budget
startDate
deadline
members[]
```

Defaults:

```text
status = PLANNING
priority = MEDIUM
```

Walidacja:

- deadline >= startDate,
- budget >= 0,
- client musi należeć do tej samej organizacji,
- members muszą należeć do tej samej organizacji.

## 20.2. Project Details

Route: `/projects/[projectId]`.

Header:

- project name,
- client,
- status,
- deadline,
- budget,
- progress.

Tabs:

```text
Overview
Tasks
Activity
```

Nie implementować Files.

Progress:

```text
if no tasks -> 0%
otherwise round(DONE / ALL * 100)
```

Nie przechowywać progress w bazie.

ADMIN może edytować projekt i zarządzać członkami.

---

# 21. Project Members

ADMIN może dodawać/usuwać członków projektu.

Użytkownik musi należeć do tej samej organizacji.

Przy usunięciu członka projektu jego task assignments w tym projekcie powinny zostać ustawione na `null` w transakcji.

---

# 22. Tasks

Route: `/tasks`.

Tabela:

```text
Task
Project
Assignee
Status
Priority
Deadline
Actions
```

Funkcje:

- search title,
- filter status,
- filter priority,
- filter project,
- filter assignee,
- pagination.

## 22.1. Create Task

ADMIN only.

Fields:

```text
title *
description
project *
assignee
status
priority
deadline
```

Defaults:

```text
status = TODO
priority = MEDIUM
```

Assignee musi:

- należeć do tej samej organizacji,
- być członkiem projektu.

## 22.2. Edit Task

ADMIN: wszystkie pola.

EMPLOYEE: tylko status zadania, do którego ma dostęp.

## 22.3. Delete Task

ADMIN only, z confirmation dialog.

Activity Log ma zachować tytuł usuniętego zadania.

## 22.4. Overdue

Task jest overdue, gdy:

```text
deadline exists
AND deadline < now
AND status != DONE
```

Nie tworzyć pola `isOverdue` w DB.

---

# 23. Kanban Board

Route: `/board`.

Kolumny:

```text
TO DO
IN PROGRESS
REVIEW
DONE
```

Karta zadania zawiera:

- title,
- project,
- priority,
- assignee avatar/initials,
- deadline.

Użyć `dnd-kit`.

Obsłużyć:

- drag między kolumnami,
- reorder w kolumnie,
- zapis `status`,
- zapis `position`,
- persistence po refresh,
- Activity Log przy zmianie statusu.

Filtry minimum:

- project,
- assignee,
- opcjonalnie `My tasks`.

Nie implementować realtime multiplayer.

---

# 24. Team

Route: `/team`.

Pokazać:

```text
Name
Email
Role
Job title
Active Projects
Open Tasks
```

ADMIN widzi całą organizację. EMPLOYEE może widzieć read-only.

W MVP nie implementować invitation flow.

Można pozostawić Team jako read-only poza profilem użytkownika.

---

# 25. Activity Log

Route: `/activity`.

Widok tabeli lub timeline.

Pola:

```text
Actor
Action
Description
Entity
Date
```

Filtry:

- entity type,
- user.

Sortowanie: newest first.

Read-only.

Logować kluczowe operacje:

- client created/updated/deleted,
- project created/updated/deleted,
- project status changed,
- project member added/removed,
- task created/updated/deleted,
- task status changed,
- task assigned,
- organization updated.

Przy zmianie statusu metadata powinno zawierać previous/new value.

Przykład description:

```text
Anna Kowalska changed task "Create landing page" from TODO to IN_PROGRESS.
```

Nie logować zwykłych odczytów.

---

# 26. Settings

## 26.1. Profile

Route: `/settings/profile`.

User może edytować:

- name,
- jobTitle.

Email read-only.

## 26.2. Organization

Route: `/settings/organization`.

ADMIN only.

Można edytować:

- organization name.

Slug read-only.

Zmiana organizacji generuje Activity Log.

---

# 27. UX

Każdy ekran danych powinien mieć:

- loading state,
- empty state,
- error state,
- success feedback.

Przykład empty state:

```text
No clients yet.
Add your first client to start managing projects.
[Add client]
```

Formularze:

- labels,
- błędy pod polami,
- disabled submit podczas zapisu,
- czytelny success/error feedback.

Preferować:

- dedykowane strony dla większych formularzy,
- Dialog/Sheet dla prostych operacji,
- AlertDialog dla destructive actions.

Toast notifications: Sonner.

Przykłady:

```text
Client created successfully.
Project updated.
Task moved to Review.
Unable to delete client because it has projects.
```

Nie używać toastów jako jedynego miejsca prezentacji błędów walidacyjnych.

---

# 28. Shared UI

Stworzyć współdzielone komponenty m.in.:

- `PageHeader`,
- `EmptyState`,
- pagination,
- confirmation dialog,
- loading/skeleton patterns,
- `ProjectStatusBadge`,
- `TaskStatusBadge`,
- `PriorityBadge`,
- `ClientStatusBadge`.

Nie duplikować mapowania kolorów statusów po wielu komponentach.

---

# 29. Daty i budżet

Daty przechowywać jako DateTime.

UI może używać formatu np.:

```text
Sep 12, 2026
```

Budżet projektu przechowywać jako `Decimal` lub inny typ bez typowych błędów floating point.

Waluta MVP: PLN.

Przykład UI:

```text
12 000 PLN
```

Nie implementować multi-currency.

---

# 30. Data fetching i state management

Preferowany model:

- Server Component pobiera dane,
- Client Component odpowiada za interakcję,
- URL search params przechowują search/filter/page,
- lokalny React state tylko tam, gdzie potrzebny.

Nie dodawać Redux ani Zustand bez rzeczywistej potrzeby.

Nie budować całej aplikacji jako Client Components.

---

# 31. Pagination, search, sorting

Domyślnie: 20 rekordów / strona.

Pagination minimum na:

- Clients,
- Projects,
- Tasks,
- Activity.

Search powinien być case-insensitive, jeśli wspierane przez PostgreSQL/Prisma.

Jeżeli search wysyła request przy wpisywaniu, zastosować debounce.

Minimum sorting:

Clients:
- name,
- createdAt.

Projects:
- deadline,
- status,
- createdAt.

Tasks:
- deadline,
- priority,
- createdAt.

Activity:
- createdAt.

Priority ordering nie może polegać na kolejności alfabetycznej.

Task priority:

```text
URGENT
HIGH
MEDIUM
LOW
```

Project priority:

```text
HIGH
MEDIUM
LOW
```

---

# 32. Server Actions i transakcje

Każda ważna Server Action musi:

1. sprawdzić sesję,
2. sprawdzić permissions,
3. zwalidować input przez Zod,
4. zweryfikować ownership organizacji,
5. zweryfikować relacje (np. client/project/assignee),
6. wykonać mutację,
7. utworzyć Activity Log, jeśli wymagane,
8. `revalidatePath` / odświeżyć odpowiednie dane,
9. zwrócić kontrolowany wynik.

Jeśli mutacja i Activity Log tworzą jedną operację logiczną, użyć Prisma transaction.

Przykład:

```text
update task status
+
create activity log
```

powinno być atomowe.

---

# 33. Delete strategy

Nie wdrażać pełnego soft delete.

Client:

- delete zablokowany, jeżeli ma projekty.

Project:

- ADMIN only,
- confirmation required,
- projekt może cascade-delete tasks i ProjectMembers,
- UI musi jednoznacznie ostrzegać, że zadania również zostaną usunięte.

Activity Log po usunięciu powinien zachować nazwę zasobu w `description`.

---

# 34. Security

## 34.1. Authorization

Nigdy nie opierać permissions wyłącznie na:

- ukryciu buttona,
- client-side route guard,
- danych z local state.

Każda chroniona operacja musi być zabezpieczona na serwerze.

## 34.2. Input validation

Każda mutacja:

- Zod,
- kontrola typów,
- kontrola ownership,
- kontrola relacji.

Nie wolno np. przypisać projektu do klienta z innej organizacji.

## 34.3. XSS

Description/notes traktować jako plaintext.

Nie używać `dangerouslySetInnerHTML` dla danych użytkownika.

## 34.4. SQL injection

Prisma jest domyślną warstwą dostępu do DB.

Unikać raw queries. Jeśli konieczne, tylko parametryzowane.

## 34.5. Secrets

`.env` nie może trafić do Git.

Przygotować `.env.example` minimum z:

```env
DATABASE_URL=
AUTH_SECRET=
```

Nie commitować realnych sekretów, tokenów GitHub, cookies ani danych prywatnych.

---

# 35. Performance

Preferować:

- Server Components,
- selektywne `select/include`,
- agregacje DB,
- pagination,
- `count` zamiast pobierania pełnych relacji,
- unikanie N+1.

Nie wykonywać zbędnych client-side fetchy.

---

# 36. Error handling

Użytkownik nie może zobaczyć:

- stack trace,
- surowego Prisma error,
- sekretów,
- szczegółów infrastruktury.

Po stronie UI prezentować kontrolowane komunikaty, np.:

```text
Something went wrong while saving the project.
Please try again.
```

Dla braku zasobu używać `notFound()` lub odpowiedniego mechanizmu Next.js.

---

# 37. Loading i empty states

Użyć:

- `loading.tsx`,
- Skeleton components,
- disabled/loading submit states.

Skeleton ma odpowiadać rzeczywistemu layoutowi.

Empty states przygotować minimum dla:

- no clients,
- no projects,
- no tasks,
- no activity,
- no filtered results.

---

# 38. Standardy kodu

Wymagane:

- TypeScript strict,
- brak `any` bez wyraźnego uzasadnienia,
- ESLint,
- spójne formatowanie,
- czytelne nazwy,
- małe funkcje,
- unikanie duplikacji.

Preferowane helpery:

```text
getCurrentUser()
requireUser()
requireAdmin()
getCurrentOrganizationId()
canAccessProject()
```

Naming:

- React components: `PascalCase`,
- variables/functions: `camelCase`,
- Prisma models: `PascalCase`,
- enum values: `UPPER_SNAKE_CASE`.

ID: preferować Prisma `cuid()`.

---

# 39. Testy

Projekt musi mieć testy. Nie jest wymagane maksymalne coverage; testować krytyczną logikę.

## 39.1. Unit tests

Użyć Vitest.

Testować minimum:

- Zod schemas,
- `calculateProjectProgress`,
- overdue logic,
- permission helpers,
- status/priority helpers,
- dashboard calculation helpers, jeśli wydzielone.

## 39.2. Integration/security tests

Testować minimum:

- Organization A nie może odczytać danych Organization B,
- Organization A nie może zmienić zasobów Organization B,
- create client,
- create project,
- create task,
- task status change,
- invalid assignee rejection,
- ADMIN/EMPLOYEE permissions.

To jest krytyczny obszar testowy.

## 39.3. E2E — Playwright

Minimum scenariusze:

### Login

```text
Admin logs in
-> dashboard is visible
```

### Client creation

```text
Admin creates client
-> client appears in list
-> details page works
```

### Project/task flow

```text
Admin creates project
-> creates task
-> task appears in project
```

### Kanban

```text
Move task TODO -> IN_PROGRESS
-> refresh
-> status remains IN_PROGRESS
```

### Permissions

```text
Employee tries to open admin-only organization settings
-> access denied/redirect/not-found as designed
```

---

# 40. README

README jest częścią portfolio i musi zawierać:

```text
# BusinessFlow

Short description

## Features
## Tech Stack
## Screenshots
## Demo Accounts
## Getting Started
## Environment Variables
## Database Setup
## Running Tests
## Architecture
## Security / Multi-tenancy
## GitHub Workflow
## Future Improvements
```

Nie wpisywać fikcyjnego live demo URL.

README powinno zawierać demo credentials i pełną instrukcję uruchomienia.

---

# 41. Local environment

Przygotować:

```text
.env.example
docker-compose.yml
```

Oczekiwany workflow:

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Aplikacja lokalnie:

```text
http://localhost:3000
```

Docker jest wymagany tylko dla lokalnego PostgreSQL. Nie trzeba konteneryzować Next.js w MVP.

PostgreSQL powinien używać persistent volume. Healthcheck dodać, jeśli nie komplikuje konfiguracji.

---

# 42. Git i GitHub — wymaganie obowiązkowe

Agent odpowiada nie tylko za kod, ale również za **pełne prowadzenie repozytorium Git i operacje GitHub**, o ile środowisko VS Code posiada dostęp do Git/GitHub i odpowiednie uwierzytelnienie.

Agent ma wykonywać samodzielnie wszystkie potrzebne operacje Git/GitHub bez przerzucania ich na użytkownika, chyba że konkretna operacja wymaga niedostępnego tokenu, autoryzacji lub ręcznej akceptacji GitHub.

## 42.1. Inicjalizacja repozytorium

Jeżeli katalog nie jest repozytorium Git:

- [ ] wykonać `git init`,
- [ ] ustawić domyślną gałąź na `main`,
- [ ] utworzyć poprawny `.gitignore`,
- [ ] upewnić się, że `.env`, sekrety, build artifacts, node_modules i dane lokalne nie będą commitowane.

Jeżeli repozytorium już istnieje, Agent ma zachować jego historię i nie wykonywać destrukcyjnej reinicjalizacji.

## 42.2. Remote GitHub

Jeżeli remote `origin` istnieje:

- używać istniejącego remote,
- nie zmieniać go bez potrzeby.

Jeżeli remote nie istnieje, a narzędzia GitHub/CLI/API i autoryzacja pozwalają utworzyć repozytorium:

- utworzyć repozytorium GitHub o sensownej nazwie, preferowane `businessflow`,
- ustawić `origin`,
- preferować repo publiczne, jeżeli charakter środowiska i użytkownika na to pozwala; jeżeli nie można bezpiecznie rozstrzygnąć widoczności, nie zmieniać ustawień prywatności arbitralnie i użyć istniejących ustawień/procedur środowiska,
- pushować `main`.

Jeżeli utworzenie remote jest niemożliwe z powodu braku autoryzacji, Agent ma nadal prowadzić lokalny Git i w końcowym raporcie dokładnie wskazać, jaka operacja GitHub nie mogła zostać wykonana.

## 42.3. Branching

Preferowany prosty workflow:

- `main` ma być stale w stanie nadającym się do uruchomienia po zakończonych etapach,
- większe funkcjonalności mogą być tworzone na branchach typu:
  - `feat/auth`,
  - `feat/clients`,
  - `feat/projects`,
  - `feat/tasks`,
  - `feat/kanban`,
  - `test/e2e`,
  - `chore/docs`.

Agent nie musi tworzyć brancha dla każdej najmniejszej zmiany. Branching ma wspierać czytelność historii, a nie generować biurokrację.

Jeżeli używane są branche feature:

- zakończona funkcja musi być zweryfikowana,
- następnie scalona do `main`,
- branch może zostać usunięty lokalnie i z remote po bezpiecznym merge.

Nie wykonywać force push na `main`.

## 42.4. Commity

Agent ma wykonywać regularne, logiczne commity przez cały development.

Nie zostawiać całej aplikacji w jednym gigantycznym finalnym commicie.

Preferować Conventional Commits:

```text
chore: initialize Next.js project
feat: add authentication and protected routes
feat: implement client management
feat: implement project management
feat: add task kanban board
feat: add activity log
fix: enforce tenant isolation for project actions
test: add multi-tenant security tests
docs: add project setup and architecture guide
```

Każdy commit powinien:

- reprezentować spójną jednostkę pracy,
- nie zawierać świadomie zepsutego kodu,
- nie zawierać sekretów,
- mieć zrozumiały opis.

Przed commitem Agent powinien przejrzeć `git diff` i `git status`.

Nie używać `git add .` bezrefleksyjnie, jeżeli istnieje ryzyko dodania sekretów lub artefaktów. Preferować świadomy staging.

## 42.5. Push

Po zakończeniu logicznych etapów i po udanym lokalnym sprawdzeniu Agent ma wykonywać push do GitHub, jeżeli remote i autoryzacja są dostępne.

Minimum:

- push po inicjalizacji stabilnego projektu,
- push po kluczowych funkcjonalnościach,
- finalny push po przejściu pełnej weryfikacji.

Po finalnym pushu lokalny `main` i `origin/main` powinny wskazywać tę samą finalną wersję.

## 42.6. Pull / synchronizacja

Przed pushem, jeżeli remote zawiera nowe zmiany, Agent ma:

- pobrać aktualny stan,
- zrozumieć różnice,
- bezpiecznie zintegrować zmiany,
- rozwiązać konflikty bez utraty pracy użytkownika.

Nie używać destrukcyjnie `git reset --hard`, force push ani przepisywania cudzej historii, chyba że użytkownik wyraźnie tego zażąda.

## 42.7. GitHub CLI

Jeżeli `gh` jest dostępne i zalogowane, Agent może i powinien używać go do operacji takich jak:

```bash
gh auth status
gh repo view
gh repo create
gh pr create
gh pr view
```

Nie ujawniać tokenów ani credentials w logach, commitach lub README.

## 42.8. Pull Requests

Dla większych feature branchy, jeżeli repozytorium i workflow na to pozwalają, Agent może tworzyć PR-y z:

- krótkim opisem zmian,
- listą testów wykonanych lokalnie,
- informacją o ewentualnych migracjach.

Jeżeli Agent ma uprawnienia do merge i branch jest w pełni zweryfikowany, może samodzielnie zmergować PR zgodnie z możliwościami środowiska.

Nie jest wymagane tworzenie PR dla każdej drobnej zmiany.

## 42.9. Issues

Nie ma potrzeby tworzyć GitHub Issues dla każdego zadania z roadmapy.

Można użyć Issues tylko wtedy, gdy realnie pomaga to w śledzeniu problemu lub przyszłego TODO.

Roadmapa w tym pliku pozostaje głównym źródłem zakresu prac.

## 42.10. Repo hygiene

Przed każdym ważnym pushem sprawdzić:

```bash
git status
git diff --check
```

Finalnie repo nie może zawierać:

- `.env`,
- realnych sekretów,
- tokenów,
- `node_modules`,
- `.next`,
- tymczasowych plików IDE,
- lokalnych dumpów bazy,
- testowych credentials poza jawnie demonstracyjnymi danymi opisanymi w specyfikacji,
- przypadkowych dużych binariów.

## 42.11. GitHub po zakończeniu projektu

Na końcu Agent ma:

- [ ] upewnić się, że wszystkie istotne zmiany są zacommitowane,
- [ ] upewnić się, że working tree jest czyste,
- [ ] sprawdzić historię commitów,
- [ ] upewnić się, że finalny commit zawiera działającą wersję,
- [ ] wykonać finalny push,
- [ ] potwierdzić zgodność lokalnego `main` z `origin/main`, jeśli remote istnieje,
- [ ] upewnić się, że README na GitHub opisuje aktualny projekt,
- [ ] nie pozostawiać otwartych własnych feature branchy bez powodu.

Jeżeli GitHub operation jest niemożliwa z powodów niezależnych od kodu (np. brak autoryzacji), Agent ma wykonać wszystko lokalnie i dokładnie opisać brakującą operację w końcowym raporcie.

---

# 43. Weryfikacja końcowa

Aplikację uznać za ukończoną dopiero po przejściu wszystkich wymaganych sprawdzeń.

## 43.1. Quality gates

Muszą przejść bez błędów:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

oraz wymagane testy E2E.

Jeżeli `typecheck` script nie istnieje, dodać go do `package.json`, np. `tsc --noEmit`.

## 43.2. Database

Na czystej bazie muszą działać:

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

Seed musi odtworzyć kompletne demo.

## 43.3. Manual QA

Sprawdzić:

- login admin,
- login employee,
- logout,
- dashboard,
- create/edit/delete client,
- create/edit/delete project,
- project members,
- create/edit/delete task,
- filters/search/pagination,
- role restrictions,
- Kanban persistence,
- Activity Log,
- profile settings,
- organization settings,
- dark mode,
- responsive sidebar,
- mobile usability,
- loading states,
- empty states,
- validation errors.

## 43.4. Security QA

Testować przynajmniej dwie organizacje.

Scenariusz:

1. utworzyć resource w Organization A,
2. zalogować się jako user Organization B,
3. użyć ID resource A w URL/action,
4. potwierdzić brak odczytu i modyfikacji.

Sprawdzić klientów, projekty i zadania.

## 43.5. Git/GitHub QA

Przed finalizacją:

```bash
git status
git diff --check
git log --oneline --decorate -n 20
```

Jeśli istnieje remote:

- upewnić się, że finalny `main` został wypchnięty,
- upewnić się, że nie ma nieopublikowanych finalnych commitów,
- upewnić się, że GitHub pokazuje aktualne README.

---

# 44. Definition of Done

Projekt jest ukończony, gdy:

- aplikacja uruchamia się lokalnie,
- PostgreSQL działa przez Docker Compose,
- migracje działają od czystej bazy,
- seed działa,
- oba konta demo działają,
- wszystkie wymagane strony istnieją,
- permissions działają,
- multi-tenancy jest bezpieczne,
- CRUD działa,
- Kanban zapisuje status i kolejność,
- dashboard pokazuje dane z DB,
- Activity Log działa,
- dark mode działa,
- UI jest responsywny,
- krytyczne testy istnieją i przechodzą,
- lint przechodzi,
- typecheck przechodzi,
- build przechodzi,
- E2E przechodzi,
- README jest kompletne,
- repo nie zawiera sekretów,
- historia Git zawiera logiczne commity,
- wszystkie finalne zmiany są zacommitowane,
- finalny push został wykonany, jeżeli GitHub jest dostępny.

---

# 45. Roadmapa realizacji

Etapy funkcjonalne 1–19 oraz dokumentacja portfolio zostały zrealizowane. Nieodhaczone etapy 20, 21 i 23 celowo pokazują pozostałe kontrole zamykające projekt.

## Etap 1 — inicjalizacja

- [x] Utwórz Next.js App Router + TypeScript.
- [x] Skonfiguruj `pnpm`.
- [x] Włącz strict TypeScript.
- [x] Skonfiguruj ESLint i formatowanie.
- [x] Skonfiguruj Tailwind CSS.
- [x] Dodaj shadcn/ui, Lucide, Sonner, next-themes.
- [x] Utwórz podstawową strukturę katalogów.
- [x] Utwórz `.env.example`.
- [x] Zweryfikuj `.gitignore`.
- [x] Zainicjalizuj lub zweryfikuj repo Git.
- [x] Wykonaj pierwszy logiczny commit.
- [x] Skonfiguruj GitHub remote, jeśli dostępny.
- [x] Wykonaj pierwszy push, jeśli możliwy.

## Etap 2 — PostgreSQL i Prisma

- [x] Dodaj `docker-compose.yml` z PostgreSQL.
- [x] Dodaj persistent volume.
- [x] Zainstaluj Prisma.
- [x] Skonfiguruj `DATABASE_URL`.
- [x] Utwórz wszystkie modele i enumy.
- [x] Dodaj relacje i `onDelete`.
- [x] Dodaj potrzebne indeksy.
- [x] Utwórz pierwszą migrację.
- [x] Zweryfikuj migrację na czystej bazie.
- [x] Commit i push etapu.

## Etap 3 — seed

- [x] Utwórz `prisma/seed.ts`.
- [x] Dodaj organizację demo.
- [x] Dodaj admina i employee.
- [x] Hashuj demo passwords.
- [x] Dodaj klientów.
- [x] Dodaj projekty.
- [x] Dodaj ProjectMembers.
- [x] Dodaj 20–30 zadań.
- [x] Dodaj overdue/completed data.
- [x] Dodaj Activity Logs.
- [x] Zweryfikuj reset + seed.
- [x] Commit i push.

## Etap 4 — Authentication

- [x] Skonfiguruj Auth.js.
- [x] Dodaj Credentials Provider.
- [x] Dodaj bezpieczne porównanie haseł.
- [x] Rozszerz session o `userId`, `organizationId`, `role`.
- [x] Utwórz `requireUser`.
- [x] Utwórz `requireAdmin`.
- [x] Zabezpiecz dashboard routes.
- [x] Zaimplementuj `/login`.
- [x] Dodaj logout.
- [x] Zweryfikuj konta demo.
- [x] Commit i push.

## Etap 5 — permissions i tenant isolation

- [x] Utwórz centralny permission layer.
- [x] Dodaj ownership helpers.
- [x] Dodaj `canAccessProject`.
- [x] Zaimplementuj ADMIN/EMPLOYEE rules.
- [x] Zaimplementuj bezpieczne zachowanie dla foreign tenant resources.
- [x] Dodaj testy permission helpers.
- [x] Dodaj test izolacji dwóch organizacji.
- [x] Commit i push.

## Etap 6 — layout i design foundation

- [x] Utwórz dashboard layout.
- [x] Utwórz Sidebar.
- [x] Utwórz Header.
- [x] Dodaj user menu.
- [x] Dodaj mobile navigation.
- [x] Dodaj theme switcher.
- [x] Dodaj shared PageHeader, badges i EmptyState.
- [x] Dodaj shared Skeleton.
- [x] Zweryfikuj desktop/tablet/mobile.
- [x] Commit i push.

## Etap 7 — Activity Log infrastructure

- [x] Utwórz helper logowania aktywności.
- [x] Dodaj wspólny model actions/entity types.
- [x] Dodaj transaction patterns.
- [x] Przetestuj log creation.
- [x] Commit i push.

## Etap 8 — Clients

- [x] Utwórz `/clients`.
- [x] Dodaj query scoped do organization.
- [x] Dodaj search/filter/pagination.
- [x] Dodaj TanStack Table.
- [x] Utwórz `/clients/new`.
- [x] Utwórz Zod schema.
- [x] Dodaj create action + Activity Log.
- [x] Utwórz `/clients/[clientId]`.
- [x] Dodaj edit.
- [x] Dodaj delete z blokadą, gdy istnieją projekty.
- [x] Dodaj loading/error/empty states.
- [x] Dodaj testy.
- [x] Commit i push.

## Etap 9 — Projects

- [x] Utwórz `/projects`.
- [x] Dodaj search i filters.
- [x] Dodaj pagination i sorting.
- [x] Dodaj EMPLOYEE scoping.
- [x] Utwórz `/projects/new`.
- [x] Dodaj schema i create action.
- [x] Dodaj ProjectMembers.
- [x] Utwórz `/projects/[projectId]`.
- [x] Dodaj Overview/Tasks/Activity tabs.
- [x] Dodaj progress calculation.
- [x] Dodaj edit project.
- [x] Dodaj member management.
- [x] Dodaj project delete confirmation.
- [x] Zweryfikuj permissions.
- [x] Commit i push.

## Etap 10 — Tasks

- [x] Utwórz task Zod schema.
- [x] Dodaj create task.
- [x] Zweryfikuj organization i project ownership.
- [x] Zweryfikuj assignee project membership.
- [x] Dodaj edit task.
- [x] Dodaj EMPLOYEE status-only restriction.
- [x] Dodaj delete task.
- [x] Dodaj Activity Logs.
- [x] Utwórz `/tasks`.
- [x] Dodaj search/filter/pagination.
- [x] Dodaj overdue indicator.
- [x] Dodaj empty states.
- [x] Commit i push.

## Etap 11 — Kanban

- [x] Utwórz `/board`.
- [x] Dodaj 4 kolumny.
- [x] Utwórz TaskCard.
- [x] Skonfiguruj dnd-kit.
- [x] Dodaj zmianę kolumny.
- [x] Dodaj reorder w kolumnie.
- [x] Persistuj status.
- [x] Persistuj position.
- [x] Dodaj Activity Log dla status changes.
- [x] Dodaj filtry project/assignee.
- [x] Dodaj `My tasks`, jeśli proste.
- [x] Zweryfikuj persistence po refresh.
- [x] Zweryfikuj mobile UX.
- [x] Zweryfikuj employee permissions.
- [x] Commit i push.

## Etap 12 — Dashboard

- [x] Dodaj KPI queries.
- [x] Dodaj Active Projects.
- [x] Dodaj Open Tasks.
- [x] Dodaj Overdue Tasks.
- [x] Dodaj Active Clients.
- [x] Dodaj project status chart.
- [x] Dodaj Upcoming Deadlines.
- [x] Dodaj Recent Activity.
- [x] Dodaj EMPLOYEE scoping.
- [x] Dodaj skeletons.
- [x] Zweryfikuj z seed data.
- [x] Commit i push.

## Etap 13 — Team

- [x] Utwórz `/team`.
- [x] Wyświetl users organizacji.
- [x] Dodaj role/job title.
- [x] Dodaj active projects count.
- [x] Dodaj open tasks count.
- [x] Dodaj read-only EMPLOYEE behavior.
- [x] Commit i push.

## Etap 14 — Activity page

- [x] Utwórz `/activity`.
- [x] Pobieraj tylko logi organizacji.
- [x] Sortuj newest first.
- [x] Dodaj pagination.
- [x] Dodaj entity type filter.
- [x] Dodaj user filter.
- [x] Dodaj empty state.
- [x] Commit i push.

## Etap 15 — Settings

- [x] Utwórz `/settings/profile`.
- [x] Dodaj name/jobTitle update.
- [x] Utwórz `/settings/organization`.
- [x] Ogranicz do ADMIN.
- [x] Dodaj organization name update.
- [x] Dodaj Activity Log.
- [x] Commit i push.

## Etap 16 — UX polish

- [x] Dodaj loading states wszędzie, gdzie potrzebne.
- [x] Dodaj empty states.
- [x] Dodaj spójne errors.
- [x] Dodaj toast feedback.
- [x] Dodaj destructive confirmations.
- [x] Zweryfikuj focus states.
- [x] Zweryfikuj keyboard navigation.
- [x] Zweryfikuj dark mode contrast.
- [x] Zweryfikuj responsive layout.
- [x] Ujednolić spacing i typography.
- [x] Ujednolić badge colors.
- [x] Usunąć zbędne animacje.
- [x] Commit i push.

## Etap 17 — Unit tests

- [x] Skonfiguruj Vitest.
- [x] Przetestuj Zod schemas.
- [x] Przetestuj progress calculation.
- [x] Przetestuj overdue logic.
- [x] Przetestuj permission helpers.
- [x] Przetestuj status/priority helpers.
- [x] Commit i push.

## Etap 18 — Integration/security tests

- [x] Utwórz testową Organization A.
- [x] Utwórz testową Organization B.
- [x] Zweryfikuj client isolation.
- [x] Zweryfikuj project isolation.
- [x] Zweryfikuj task isolation.
- [x] Zweryfikuj assignment restrictions.
- [x] Zweryfikuj ADMIN permissions.
- [x] Zweryfikuj EMPLOYEE permissions.
- [x] Commit i push.

## Etap 19 — E2E

- [x] Skonfiguruj Playwright.
- [x] Dodaj admin login E2E.
- [x] Dodaj create client E2E.
- [x] Dodaj project/task flow E2E.
- [x] Dodaj Kanban persistence E2E.
- [x] Dodaj employee permission E2E.
- [x] Commit i push.

## Etap 20 — final code verification

- [ ] Uruchom `pnpm lint`.
- [ ] Napraw wszystkie lint errors.
- [ ] Uruchom `pnpm typecheck`.
- [ ] Napraw wszystkie TypeScript errors.
- [ ] Uruchom unit tests.
- [ ] Uruchom integration tests.
- [ ] Uruchom E2E tests.
- [ ] Uruchom production build.
- [ ] Usuń debug logs.
- [ ] Usuń dead code.
- [ ] Usuń nieużywane dependencies.
- [ ] Sprawdź brak `any` bez uzasadnienia.
- [ ] Sprawdź brak sekretów.
- [ ] Commit poprawek końcowych.

## Etap 21 — manual QA

- [ ] Zresetuj bazę.
- [ ] Uruchom migracje od zera.
- [ ] Uruchom seed.
- [ ] Zaloguj się jako ADMIN.
- [ ] Sprawdź Dashboard.
- [ ] Utwórz i edytuj klienta.
- [ ] Utwórz projekt.
- [ ] Przypisz pracownika.
- [ ] Utwórz task.
- [ ] Przesuń task w Kanbanie.
- [ ] Odśwież i sprawdź persistence.
- [ ] Sprawdź Activity Log.
- [ ] Zaloguj się jako EMPLOYEE.
- [ ] Sprawdź ograniczenie danych.
- [ ] Sprawdź admin-only routes.
- [ ] Sprawdź foreign tenant IDs.
- [ ] Sprawdź dark mode.
- [ ] Sprawdź mobile navigation.
- [ ] Sprawdź empty states.
- [ ] Sprawdź błędne formularze.

## Etap 22 — README i portfolio

- [x] Napisz kompletne README.
- [x] Dodaj architecture overview.
- [x] Dodaj tech stack.
- [x] Dodaj setup instructions.
- [x] Dodaj demo credentials.
- [x] Dodaj database/seed instructions.
- [x] Dodaj testing instructions.
- [x] Opisz multi-tenancy.
- [x] Opisz permissions.
- [x] Opisz Git/GitHub workflow.
- [x] Dodaj Future Improvements.
- [x] Przygotuj sekcję Screenshots.
- [x] Nie dodawaj fikcyjnego live demo.
- [x] Commit dokumentacji.

## Etap 23 — final Git/GitHub delivery

- [ ] Uruchom `git status`.
- [ ] Uruchom `git diff --check`.
- [ ] Upewnij się, że working tree jest czyste.
- [ ] Przejrzyj ostatnie commity.
- [ ] Upewnij się, że żaden commit nie zawiera sekretów.
- [ ] Upewnij się, że `main` zawiera finalną zweryfikowaną wersję.
- [ ] Scal pozostałe własne feature branche, jeśli są gotowe.
- [ ] Usuń niepotrzebne zakończone branche.
- [ ] Wykonaj finalny push do `origin/main`, jeśli GitHub jest dostępny.
- [ ] Potwierdź zgodność local `main` z `origin/main`.
- [ ] Sprawdź README na GitHub.
- [ ] W końcowym raporcie podaj wykonane quality gates i status GitHub.

---

# 46. Finalne polecenie dla Agenta AI

Zrealizuj BusinessFlow od zera do działającej, przetestowanej i opublikowanej w repozytorium wersji zgodnie z tą specyfikacją.

Priorytety:

1. poprawność działania,
2. bezpieczeństwo i izolacja tenantów,
3. autoryzacja,
4. spójna architektura,
5. jakość TypeScript,
6. UX,
7. profesjonalny wygląd,
8. testowalność,
9. wydajność,
10. czysta historia Git/GitHub,
11. finalny polish.

Nie rozszerzaj zakresu ponad opisane MVP.

Nie traktuj UI jako statycznego mockupu. Wszystkie główne ekrany muszą korzystać z rzeczywistych danych PostgreSQL.

Nie implementuj skrótów naruszających bezpieczeństwo, np. filtrowania danych organizacji dopiero na froncie.

Po każdym większym etapie:

- sprawdź działanie,
- sprawdź permissions,
- sprawdź tenant ownership,
- sprawdź validation,
- sprawdź loading/error/empty states,
- przejrzyj diff,
- wykonaj logiczny commit,
- wykonaj push, jeśli remote GitHub jest dostępny.

Po zakończeniu uruchom:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

oraz wymagane testy E2E.

Jeżeli którekolwiek wymagane sprawdzenie kończy się błędem, projekt nie jest ukończony.

Docelowy lokalny workflow:

```bash
git clone <repository-url>
cd businessflow
pnpm install
docker compose up -d
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Po uruchomieniu użytkownik ma móc wejść na:

```text
http://localhost:3000
```

i od razu zalogować się na konta demonstracyjne.

Finalny rezultat ma wyglądać i działać jak niewielki rzeczywisty produkt B2B SaaS, a repozytorium GitHub ma być gotowe do pokazania w portfolio.
