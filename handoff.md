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
