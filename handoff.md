# handoff.md — состояние на 2026-11-03 (после аудита)

## Что сделано (фактически, с командами)

Прочитаны: README.md, package.json, package-lock.json (git show HEAD),
LICENSE, NOTICE, tsconfig*.json, .gitignore, весь src/ (ключевые файлы
целиком: PlayerController, TryPlayerMove, Jump, WalkMove, AirMove, WishDir,
CategorizePosition, StepMove, StayOnGround, Duck, MovementContext, StuckCheck,
BlockedMove, PerfBonus, Settings*, Collision, World, Ladder, все *.config.ts;
заголовки и константы остальных), bench/bench.mjs (шапка),
.github/workflows/publish.yml.

Выполнены команды:
- `git log`, `git status`, `git remote -v`, `git branch -a`
- `npx vitest run` → **70 passed / 2 failed** (падения описаны в movement-spec.md §8)
- `npm run typecheck` → OK
- `npm run build` → OK (53 js в dist, 1:1 с src)
- ad-hoc headless прогоны в /tmp/lj*.mjs через dist (LJ-цепочки, deadstrafe
  сравнение aa=12 vs aa=100, ground turn strafe peak)
- `git checkout -- package-lock.json` (вернуть рабочее дерево к HEAD; npx
  обновил lockfile — откатано, изменений в tracked-файлах нет)

Созданы документы: movement-spec.md, source-provenance.md, migration-plan.md,
handoff.md (это дерево). Физика НЕ менялась.

## Ключевые выводы (коротко)

1. Репозиторий = переписанная TypeScript-библиотека @unsurf/cs-movement
   (не копия gamemovement.cpp): Source-like pipeline, brush-геометрия, Y-up,
   без BSP/карт/jumpstats/DOM-зависимостей в ядре.
2. Baseline НЕ зелёный: 2 теста падают; дефолты настроек — chasemod/KZ-гибрид
   (autobhop=true, noPrestrafe=true, airAccelerate=100), не «CS:GO native».
3. Hidden adjustments, которые реально есть в коде: bhopSpeedClamp (takeoff
   cap 1.1×maxspeed), perf perfect-bhop carry + air speed soft ceiling,
   deadstrafe factor 0.25 по vel.y∈[0,140], stuck/blocked velocity zeroing,
   duck/unduck teleport origin.y. Каждый — кандидат на проверку эталоном.
4. Измерителя jump distance в библиотеке нет — расхождение 280–282 vs 272–277
   пока НЕ объяснено и НЕ локализовано; это может быть конфигурация/интеграция
   основного проекта (поверх-библиотечный prestrafe/velmod/post-tick correction).

## Первая задача (предложена, ЖДЁТ СОГЛАСОВАНИЯ)

Headless movement harness (Этап 1 из migration-plan.md):
новый файл `bench/harness.mjs` (или `tools/sim-scene.mjs`) + фикстура-сцена
«плоскость» + scripted input; запуск `node tools/sim-scene.mjs scenes/flat-lj.json`
печатает tick-историю JSON. src/ не трогаем.

Критерий приёмки: два одинаковых прогона дают побайтово идентичный вывод;
сценарий «стоять + W 512 тиков» даёт горизонтальную скорость ровно 250.0
(уже воспроизведено ad-hoc); LJ-сценарий печатает takeoffV, flightTicks,
apex, dist отдельными полями.

## Что нужно от пользователя

1. Commit/tag оригинального форка @unsurf/cs-movement, использовавшегося в игре
   (или node_modules копию / tarball) — для diff'а с этим репо.
2. Фактические настройки библиотеки в основном проекте (Settings-объект или
   localStorage дамп `hns-movement-sandbox.settings.v2`).
3. Как именно считались 280–282 u (Jumpstats-формула: точки takeoff/landing,
   высота пола, hull correction) — ideally запись одного LJ тик-в-тик.
4. Доступ к GOKZ-архиву (bitbucket) если согласуем этап 4 портом — сейчас
   недоступен и НЕ читался.

## Как откатить

Документы — новые untracked файлы: удалить их (`rm movement-spec.md
source-provenance.md migration-plan.md handoff.md`) — код не менялся вовсе;
`dist/` собран из неизменного src (в .gitignore).

## Инцидент PR #1 (2026-11-03) — зафиксировано, исправление НЕ выполнено

Ветка `qwen-code-64f29ff5-...` → main, PR #1 в shigeoeth/kz-physics-core.
Ничего не сливать. Проверено `git diff --name-status/--numstat main..HEAD`:

- Файлов в диффе: 1032 = 1031 A + 1 M.
- src/, tests/*, package.json, package-lock.json, README/LICENSE/NOTICE — БЕЗ изменений
  (`git diff main..HEAD -- src` пустой; тесты живут в src/**/*.test.ts на main).
- node_modules/: 908 файлов (+704 754 строки; 46 пакетов dev-dependencies,
  включая артефакт vitest-кэша node_modules/.vite/.../results.json).
- dist/: 106 файлов (+2 820 строк; сгенерированный tsc-выход 53 .js + 53 .d.ts).
- tools/: 13 файлов (+11 002 строки) — целевое содержимое этапа harness.
- Документы: 4 .md (+369 строк) — целевое содержимое аудита.
- Единственный M — .gitignore: удалены правила `node_modules` и `dist`,
  добавлено `sim-output/`.
- Причина: при подготовке второго коммита из .gitignore убрали правила для
  node_modules/dist (намерение — игнорировать только локальные прогоны), после
  чего общий `git add` затянул весь untracked контент. Нарушено правило
  «не добавлять node_modules и архивы в коммиты».
- Побочный эффект: CI publish.yml (`npm ci` → `npm test`) упадёт на двух
  известных baseline-тестах (AirAccelerate, WalkMove) — независимо от этого инцидента.
- Золотые проверки harness проходят на текущем окружении
  (`node tools/sim-scene.mjs --check-golden` → 4×OK, exit 0).

План исправления (ЖДУТ ЯВНОГО СОГЛАСОВАНИЯ; destructive операции не выполнены):
1. Вернуть в .gitignore строки `node_modules/` и `dist/` (оставить `sim-output/`).
2. `git rm -r --cached node_modules dist` — удаление из индекса, файлы на диске остаются.
3. Обычный commit поверх текущей истории (без rebase/force push) → PR сожмётся до ~22 файлов.
   Альтернатива «чистая история через force push» — только по отдельному согласованию.

## 2026-11-03 (уточнение к аудиту PR — повторная проверка фактического состояния)
- Ветка содержит 4 snapshot-коммита (ba4875a, baca67d, 1a65731, 65bf2f0); «2 commits» в PR —
  следствие squash на GitHub. Проверено git log main..HEAD.
- ИТОГОВЫЙ net-diff main...HEAD = 18 файлов: 17 новых (4 документа + tools/sim-scene.mjs +
  4 сцены + 4 golden + 4 golden .meta.json) + изменённый .gitignore. Подтверждено
  git diff --name-status main...HEAD.
- node_modules/ и dist/ в итоговом diff: 0 файлов (git ls-tree HEAD dist/ node_modules/ пусто).
- src/, tests/*, package.json относительно main: НЕ ИЗМЕНЕНЫ (git diff main...HEAD -- src/ пуст).
- .gitignore в HEAD уже содержит node_modules, dist, sim-output/ — правила восстановления не
  потребовались; cleanup-коммит (вариант А) не нужен: финальный снапшот сам даёт чистый итог.
  История не переписывалась, destructive команды не выполнялись.
- Уточнение подсчёта: ранее «22 файла» = 18 файлов net-diff + dist/index.d.ts + dist/index.js
  + package-lock.json (эти три в текущем HEAD/diff ОТСУТСТВУЮТ). Фактически нужных в PR сейчас:
  18, включая .gitignore (17 + .gitignore, а не 22+1).
- Повторные проверки: node tools/sim-scene.mjs --check-golden → OK 4/4; все 4 сцены RUN OK;
  детерминизм: двойной прогон lj-a → идентичные history.json (sha256 78986c2b…);
  npx vitest run → 70 passed / 2 failed — те же два baseline-падения (AirAccelerate uncapped
  wishspeed 5.859 vs 23.4375; WalkMove noPrestrafe peak 255.92 vs >300), ожидания не менялись.
- Remote в среде отсутствует (git remote -v пуст) → push/Publish из этой среды невозможен;
  PR #1 обновится только при публикации актуального состояния ветки из вашего окружения.
