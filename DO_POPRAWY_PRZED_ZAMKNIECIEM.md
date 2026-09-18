# BusinessFlow — poprawki przed zamknięciem projektu

> **Status realizacji:** poprawki techniczne zostały wdrożone. Pozostały finalny QA i końcowa dostawa Git/GitHub.

## Cel

Traktuj ten dokument jako końcową listę poprawek jakościowych przed uznaniem projektu **BusinessFlow** za zamknięty i gotowy do pokazania w portfolio.

Nie dodawaj nowych funkcji produktowych poza tym, co jest potrzebne do naprawienia niżej opisanych problemów. Nie rozszerzaj scope o Stripe, pliki, AI, powiadomienia, client portal ani inne elementy spoza obecnego MVP.

Najpierw przeczytaj:

- `PROJECT_SPEC.md`,
- `README.md`,
- aktualny kod,
- aktualne testy,
- historię Git,
- aktualny stan repozytorium.

Następnie wykonaj poniższe zadania po kolei.

---

# 1. Zasady pracy

- Nie przepisuj aplikacji od zera.
- Nie zmieniaj istniejącej architektury bez potrzeby.
- Zachowaj aktualne zachowanie MVP, chyba że jest ono błędne względem `PROJECT_SPEC.md`.
- Wszystkie poprawki muszą respektować multi-tenancy.
- `organizationId`, role i permissions zawsze mają pochodzić z zweryfikowanej sesji / aktualnego użytkownika.
- Nie ufaj ID przekazanym z przeglądarki bez ponownej walidacji po stronie serwera.
- Nie ujawniaj istnienia zasobów z innej organizacji.
- Nie dodawaj sekretów do repo.
- Nie modyfikuj danych demo bez potrzeby.
- Nie usuwaj istniejących testów tylko dlatego, że przestają przechodzić — napraw kod albo popraw test, jeśli test jest błędny.
- Po każdym większym etapie uruchom odpowiednie testy.
- Wykonuj logiczne commity.
- Po pełnej weryfikacji wykonaj push do GitHub.
- Nie używaj destrukcyjnego `git reset --hard`.
- Nie używaj zwykłego `git push --force`.
- Jeżeli przepisywanie historii nie jest konieczne, nie przepisuj jej.

---

# 2. Krytyczna poprawka: scoped lista klientów w filtrze Projects

## Problem

Na stronie `/projects` użytkownik `EMPLOYEE` widzi w filtrze klientów listę wszystkich klientów swojej organizacji, nawet jeżeli nie ma dostępu do projektów danego klienta.

Sam widok `/clients` jest poprawnie ograniczony przez `clientScope(user)`, ale select klientów na stronie Projects używa obecnie wyłącznie:

```ts
where: {
  organizationId: user.organizationId;
}
```

To powoduje niepotrzebne ujawnienie nazw klientów.

## Wymagane zachowanie

- `ADMIN` widzi wszystkich klientów swojej organizacji.
- `EMPLOYEE` widzi tylko klientów powiązanych z projektami, do których jest przypisany.
- Zachowanie filtra ma być zgodne z `clientScope(user)`.
- ID klienta z query params nie może umożliwić obejścia `projectScope(user)`.

## Zadanie

- Napraw query pobierające klientów dla filtra `/projects`.
- Preferuj ponowne użycie istniejącego helpera `clientScope(user)`.
- Zweryfikuj również, czy analogiczny problem nie występuje w innych filtrach/selectach.

## Test

Dodaj test potwierdzający, że `EMPLOYEE` nie otrzymuje nazw klientów spoza swoich projektów.

---

# 3. Activity Log — uzupełnić brakujące zdarzenia wymagane przez specyfikację

## Problem

Aktualny Activity Log działa dla wielu mutacji, ale nie rejestruje wszystkich operacji wymaganych przez `PROJECT_SPEC.md`.

Brakuje co najmniej:

- osobnego logu dodania członka projektu,
- osobnego logu usunięcia członka projektu,
- logu przypisania zadania do użytkownika,
- logu zmiany assignee zadania,
- opcjonalnie czytelnego rozróżnienia między przypisaniem a odpięciem assignee.

## Wymagane zdarzenia

Activity Log powinien rejestrować kluczowe operacje:

- client created,
- client updated,
- client deleted,
- project created,
- project updated,
- project deleted,
- project status changed,
- project member added,
- project member removed,
- task created,
- task updated,
- task deleted,
- task status changed,
- task assigned / reassigned / unassigned,
- organization updated.

## Zadanie — Project Members

Podczas edycji projektu:

1. porównaj poprzedni zestaw `members` z nowym `memberIds`,
2. wykryj `addedMemberIds`,
3. wykryj `removedMemberIds`,
4. utwórz osobne wpisy Activity Log dla każdej faktycznej zmiany członkostwa,
5. zachowaj obecne zachowanie polegające na odpinaniu assignee od tasków, gdy użytkownik zostaje usunięty z projektu.

Opis logów powinien być czytelny, np.:

```text
Anna Kowalska added Marek Nowak to project “Website Redesign”.
Anna Kowalska removed Marek Nowak from project “Website Redesign”.
```

Jeżeli potrzebujesz nazwy użytkownika do logu, pobierz ją bezpiecznie z organizacji bieżącego admina.

## Zadanie — Task Assignee

Podczas tworzenia i aktualizacji zadania:

- jeżeli task zostaje przypisany do użytkownika, wygeneruj Activity Log,
- jeżeli assignee się zmienia, wygeneruj Activity Log,
- jeżeli assignee zostaje usunięty, wygeneruj Activity Log,
- nie twórz fałszywego wpisu `ASSIGNED`, jeżeli assignee się nie zmienił.

Przykłady:

```text
Anna Kowalska assigned task “Prepare dashboard layout” to Marek Nowak.
Anna Kowalska reassigned task “Prepare dashboard layout” from Marek Nowak to Jan Nowak.
Anna Kowalska unassigned Marek Nowak from task “Prepare dashboard layout”.
```

Jeżeli aktualny enum `ActivityAction` wystarcza, użyj go. Jeżeli potrzebna jest zmiana enuma, wykonaj ją tylko wtedy, gdy jest uzasadniona i przygotuj poprawną migrację Prisma.

## Metadata

Dla zmian statusu i assignee dodaj sensowne metadata, np.:

```json
{
  "previous": "...",
  "next": "...",
  "projectId": "..."
}
```

Nie zapisuj w metadata żadnych sekretów ani zbędnych danych prywatnych.

## Testy

Dodaj testy potwierdzające:

- logowanie member added,
- logowanie member removed,
- logowanie assignment change,
- brak dodatkowego logu, gdy assignee się nie zmienił.

---

# 4. Kanban — uporządkować semantykę `position`

## Problem

Aktualny Kanban używa globalnego `position` razem ze `status`, a operacje mogą być wykonywane na przefiltrowanym zbiorze tasków.

To może prowadzić do sytuacji, w której:

- użytkownik widzi tylko część tasków,
- reorder jest liczony na tej części,
- niewidoczne taski zachowują wcześniejsze pozycje,
- w pełnym boardzie mogą powstać powtarzające się lub niejednoznaczne wartości `position`.

## Docelowa semantyka

Dla BusinessFlow preferuj:

```text
projectId + status + position
```

Czyli kolejność tasków ma być logicznie utrzymywana w obrębie projektu i kolumny statusu.

## Zadanie

Przeanalizuj aktualny model Kanbana i popraw go tak, aby:

- reorder był deterministyczny,
- filtrowanie nie niszczyło kolejności niewidocznych tasków,
- `position` miał jasną semantykę,
- persistence po refresh nadal działała,
- drag pomiędzy kolumnami nadal działał,
- reorder w jednej kolumnie nadal działał,
- EMPLOYEE nadal mógł zmieniać status tasków tylko w projektach, do których ma dostęp,
- nie dało się manipulować taskami spoza dostępnego scope.

Jeżeli najlepszym rozwiązaniem jest utrzymanie kolejności per:

```text
projectId + status
```

wdroż tę wersję.

## Ważne

Nie wprowadzaj niepotrzebnie nowego osobnego modelu `KanbanColumn` ani event sourcingu.

## Indeksy

Jeżeli wymaga tego poprawiona implementacja, dostosuj indeks Prisma, np. pod:

```text
organizationId + projectId + status + position
```

Przy zmianie Prisma schema utwórz poprawną migrację.

## Testy

Dodaj testy dla:

- reorder w tej samej kolumnie,
- przeniesienie pomiędzy statusami,
- persistence,
- filtrowanego boardu,
- braku wpływu reordera na taski spoza danego projektu,
- braku możliwości manipulacji taskiem z obcego tenant/scope.

---

# 5. Rozszerzyć testy multi-tenancy na warstwę aplikacyjną

## Problem

Obecne testy tenant isolation dobrze testują Prisma i DB constraints, ale w zbyt małym stopniu testują realne zachowanie Server Actions i permissions pod różnymi sesjami.

## Cel

Testy powinny udowodnić nie tylko integralność DB, ale również to, że warstwa aplikacyjna nie pozwala na cross-tenant read/write.

## Zadanie

Dodaj testy na poziomie możliwie zbliżonym do realnej aplikacji dla dwóch organizacji:

```text
Organization A
Organization B
```

Sprawdź minimum:

### Clients

- user z B nie może odczytać Client A,
- admin z B nie może edytować Client A,
- admin z B nie może usunąć Client A.

### Projects

- user z B nie może odczytać Project A,
- admin z B nie może edytować Project A,
- admin z B nie może usunąć Project A.

### Tasks

- user z B nie może odczytać Task A,
- user z B nie może zmienić jego statusu,
- admin z B nie może edytować ani usunąć Task A.

### Employee scope

- EMPLOYEE z Organization A widzi tylko projekty przypisane,
- widzi tylko klientów wynikających z tych projektów,
- widzi tylko Activity Log wynikający z dostępnego scope,
- może zmieniać status tylko tasków z dostępnych projektów.

Jeżeli bezpieczne przetestowanie Server Actions wymaga niewielkiego refactoru logiki z auth-dependent action do testowalnej funkcji serwisowej, wykonaj go rozsądnie bez nadmiernej przebudowy.

---

# 6. Uodpornić E2E Kanbana

## Problem

Test E2E Kanbana używa stałego seeded taska, np.:

```text
Create landing page
```

i mutuje jego status.

Przy wielokrotnym lokalnym uruchamianiu na tej samej bazie test może stać się zależny od wcześniejszego stanu.

## Zadanie

Zmień setup E2E tak, aby testy były deterministyczne.

Preferowane rozwiązania:

1. reset/seed bazy przed całym zestawem E2E,
2. albo dedykowany test fixture tworzony przed testem,
3. albo reset konkretnego taska do znanego stanu.

Nie twórz niepotrzebnie skomplikowanego test infrastructure.

## Wymaganie

Każde uruchomienie:

```bash
pnpm test:e2e
```

na poprawnie przygotowanej bazie ma dawać ten sam wynik niezależnie od wcześniejszego lokalnego uruchomienia testu.

---

# 7. E2E przeciwko produkcyjnemu buildowi

## Cel

Obecny CI buduje aplikację, ale Playwright standardowo uruchamia `pnpm dev`.

Końcowa weryfikacja powinna testować rzeczywisty production build.

## Zadanie

Dostosuj CI / Playwright tak, aby:

1. `pnpm build` został wykonany,
2. E2E w CI uruchamiał aplikację przez:

```bash
pnpm start
```

3. nadal używał izolowanej bazy `businessflow_e2e`,
4. wszystkie obecne Playwright tests nadal przechodziły.

Możesz wykorzystać już istniejącą flagę `PLAYWRIGHT_PRODUCTION`, jeżeli została do tego przygotowana.

Nie komplikuj lokalnego developer experience — lokalnie Playwright może nadal wspierać `pnpm dev`, jeśli jest to wygodniejsze.

---

# 8. Refactor największych plików — tylko jeśli bezpieczny

**Decyzja:** pominięto świadomie. Oba pliki pozostają czytelne, a ich podział tuż przed finalnym QA zwiększałby ryzyko regresji bez zmiany zachowania aplikacji.

## Problem

Dwa pliki zaczynają być za duże:

```text
src/features/actions.ts
src/components/forms/resource-forms.tsx
```

## Zadanie

Wykonaj niewielki, bezpieczny refactor wyłącznie jeżeli nie zwiększa znacząco ryzyka.

Preferowana struktura:

```text
src/features/clients/actions.ts
src/features/projects/actions.ts
src/features/tasks/actions.ts
src/features/settings/actions.ts

src/components/forms/client-form.tsx
src/components/forms/project-form.tsx
src/components/forms/task-form.tsx
src/components/forms/profile-form.tsx
src/components/forms/organization-form.tsx
```

Możesz zachować barrel exports, aby nie zmieniać niepotrzebnie wielu importów.

## Ważne

Ten punkt jest niższego priorytetu niż security, Activity Log, Kanban i testy.

Jeżeli refactor zwiększa ryzyko regresji tuż przed finalizacją projektu, pomiń go i odnotuj to w końcowym raporcie.

---

# 9. Doprecyzować server-only boundary

## Zadanie

Sprawdź warstwę DB i serwerowe helpery.

Jeżeli zgodne z Next.js 16, dodaj:

```ts
import "server-only";
```

do modułów, które nie powinny być możliwe do importowania w Client Components, np.:

```text
src/lib/db.ts
src/lib/auth-helpers.ts
src/lib/activity.ts
src/lib/activity-scope.ts
```

Nie dodawaj tego bezmyślnie do modułów używanych po stronie klienta.

Dopasuj README, jeżeli obecny opis „server-only data access layer” jest zbyt mocny względem faktycznej architektury.

---

# 10. Posprzątać `PROJECT_SPEC.md`

## Problem

`PROJECT_SPEC.md` nadal zawiera roadmapę z nieodhaczonymi:

```text
- [ ]
```

mimo że MVP zostało wykonane.

Dla osoby oglądającej repo może to wyglądać jak niedokończony projekt.

## Zadanie

Nie usuwaj specyfikacji.

Zaktualizuj roadmapę tak, aby:

- wykonane punkty miały `- [x]`,
- rzeczy celowo pozostawione poza MVP były jasno oznaczone jako poza zakresem,
- nie oznaczaj jako ukończonych rzeczy, których rzeczywiście nie ma,
- Definition of Done odpowiadała stanowi repo po wykonaniu wszystkich poprawek z tego dokumentu.

Na początku lub końcu `PROJECT_SPEC.md` możesz dodać krótką informację:

```text
Status: MVP completed
```

jeżeli po finalnej weryfikacji jest to prawdą.

---

# 11. README i repo portfolio

Po zakończeniu technicznych poprawek przejrzyj README.

## Sprawdź

- czy tech stack odpowiada faktycznie użytym wersjom,
- czy komendy instalacji są poprawne,
- czy komendy testów są poprawne,
- czy opis security odpowiada faktycznej implementacji,
- czy Future Improvements nadal mają sens,
- czy screenshoty nadal odpowiadają aktualnemu UI.

Jeżeli UI się nie zmieniło, nie generuj screenshotów ponownie bez potrzeby.

## Opcjonalne drobne ulepszenia

Jeżeli nie wymaga to zewnętrznych usług:

- dodaj informację o statusie CI,
- upewnij się, że repo description i topics są sensowne,
- możesz dodać odpowiedni `LICENSE`, ale tylko jeżeli decyzja jest oczywista; w przeciwnym razie pozostaw bez zmian.

Nie wdrażaj aplikacji na hosting w ramach tego zadania, chyba że deployment jest już skonfigurowany.

---

# 12. Branch protection

Nie jest to blokujące.

Jeżeli GitHub API / CLI i uprawnienia pozwalają, możesz skonfigurować prosty ruleset dla `main`, wymagający przejścia CI przed merge.

Nie blokuj jednak całego zadania, jeżeli GitHub plan/uprawnienia na to nie pozwalają.

Nie utrudniaj użytkownikowi dalszej pracy w repo.

---

# 13. Pełna końcowa weryfikacja

Po wykonaniu poprawek uruchom pełny zestaw kontroli.

## Kod

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Wszystkie muszą zakończyć się sukcesem.

## Integration

Na izolowanej bazie testowej:

```bash
pnpm db:deploy
pnpm test:integration
```

Nie używaj produkcyjnej bazy.

## E2E

Na izolowanej bazie E2E:

```bash
pnpm db:deploy
pnpm db:seed
pnpm test:e2e
```

W CI E2E ma działać przeciwko production buildowi.

## Manual sanity check

Sprawdź minimum:

- ADMIN login,
- EMPLOYEE login,
- logout,
- dashboard,
- clients,
- projects,
- tasks,
- board,
- team,
- activity,
- profile settings,
- organization settings,
- dark mode,
- mobile navigation,
- scoped client list dla EMPLOYEE,
- scoped Activity Log dla EMPLOYEE,
- Kanban persistence,
- brak cross-tenant dostępu.

---

# 14. Git / GitHub

Przed rozpoczęciem zmian:

```bash
git status
git log --oneline --decorate -n 20
```

Upewnij się, że nie nadpisujesz niezatwierdzonej pracy użytkownika.

Wykonuj logiczne commity, np.:

```text
fix: scope project client filters for employees
fix: complete activity audit events
fix: make kanban ordering project scoped
test: strengthen tenant isolation coverage
test: make e2e setup deterministic
ci: run playwright against production build
docs: finalize project specification and readme
```

Nie muszą to być dokładnie te nazwy, ale historia ma być logiczna.

Po zakończeniu:

```bash
git status
git diff --check
git log --oneline --decorate -n 20
```

Repo ma być czyste.

Jeżeli `origin` i autoryzacja są dostępne:

```bash
git push
```

Po pushu sprawdź, czy:

- `main` i `origin/main` wskazują finalną wersję,
- najnowszy GitHub Actions workflow przeszedł,
- README na GitHubie jest aktualny.

Jeżeli CI po pushu nie przechodzi, napraw przyczynę i wykonaj kolejny logiczny commit + push.

---

# 15. Kryteria zakończenia tego zadania

Projekt można uznać za finalnie zamknięty dopiero, gdy:

- [x] EMPLOYEE nie widzi klientów spoza swoich projektów w żadnym filtrze ani selectcie.
- [x] Activity Log rejestruje project member add/remove.
- [x] Activity Log rejestruje task assignment/reassignment/unassignment.
- [x] Kanban ordering ma jednoznaczną, bezpieczną semantykę.
- [x] Filtrowanie boardu nie psuje kolejności niewidocznych tasków.
- [x] Cross-tenant Server Actions są zabezpieczone i pokryte testami.
- [x] E2E są deterministyczne.
- [x] CI uruchamia Playwright przeciwko production buildowi.
- [x] `pnpm lint` przechodzi.
- [x] `pnpm typecheck` przechodzi.
- [x] `pnpm test` przechodzi.
- [x] `pnpm build` przechodzi.
- [x] `pnpm test:integration` przechodzi.
- [x] `pnpm test:e2e` przechodzi.
- [x] `PROJECT_SPEC.md` pokazuje prawdziwy status MVP.
- [x] README odpowiada aktualnej implementacji.
- [x] repo nie zawiera sekretów ani artefaktów testowych.
- [ ] `git status` jest czysty.
- [ ] wszystkie finalne zmiany zostały zacommitowane.
- [ ] finalny push został wykonany.
- [ ] finalny GitHub Actions workflow zakończył się sukcesem.

---

# 16. Końcowy raport Agenta

Po zakończeniu pracy nie kończ tylko komunikatem „done”.

Przedstaw krótki raport zawierający:

1. **Naprawione problemy**  
   Lista konkretnych zmian.

2. **Zmiany w bezpieczeństwie**  
   Co zostało poprawione w permissions / multi-tenancy.

3. **Zmiany w Kanbanie**  
   Jak ostatecznie zdefiniowano i zabezpieczono `position`.

4. **Activity Log**  
   Jakie nowe zdarzenia są rejestrowane.

5. **Testy**  
   Podaj wynik:
   - lint,
   - typecheck,
   - unit,
   - integration,
   - build,
   - E2E.

6. **Git/GitHub**  
   Podaj:
   - utworzone commity,
   - czy push się udał,
   - czy `main` jest zsynchronizowany z `origin/main`,
   - wynik finalnego GitHub Actions.

7. **Pozostawione świadomie TODO**  
   Tylko rzeczy faktycznie poza MVP / niskiego priorytetu.

Jeżeli jakikolwiek wymagany punkt nie został wykonany, napisz to wprost i nie oznaczaj projektu jako w pełni zamkniętego.
