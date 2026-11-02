# source-provenance.md

Статус: **заполняется по мере проверки**. Пустые поля помечены `НЕ ПОДТВЕРЖДЕНО`.
Никаких внешних референсов я в этом ответе не читал (нет доступа к сети) — все
заявления ниже основаны **только** на содержимом `/workspace` и на запускавшихся
там командах.

## 1. Что подтверждено локально

| Факт | Откуда подтверждено |
| --- | --- |
| Пакет называется `@unsurf/cs-movement`, version `0.1.0` (package.json) | прочитан `package.json` |
| В committed `package-lock.json` стоит version `0.4.1` | `git show HEAD:package-lock.json` |
| Лицензия Apache-2.0, copyright 2026 unsurf; NOTICE требует сохранять LICENSE/NOTICE | прочитаны `LICENSE`, `NOTICE`, заголовки `@license` в файлах `src/` |
| Единственный коммит: `e95d90f "Initial commit: clean physics core"`, дата 2026-11-03; исходная история форка отсутствует | `git log` |
| Remote-конфигурация отсутствует (`git remote -v` пуст) | выполнено |
| Заявленный upstream в package.json: `github.com/unsurf/cs-movement` | прочитан `package.json`; **сам репозиторий недоступен проверке из этой среды** |
| TS-проект, vitest-тесты рядом с исходниками, сборка `tsc -p tsconfig.build.json` | `package.json`, `tsconfig*.json` |
| Внутренние provenance-комментарии вида `Provenance (Valve source-sdk-2013, game/shared/gamemovement.cpp): CGameMovement::AirAccelerate / Accelerate / Friction / ClipVelocity` | присутствуют в заголовках соответствующих модулей `src/physics/*` |

**Важно:** комментарий «Provenance (Valve source-sdk-2013…)» — это *заявление
авторов библиотеки*, а не проверка. Я не сверял эти функции с реальным
исходником Source SDK 2013 (его нет в среде). Статус: НЕ ПОДТВЕРЖДЕНО.

## 2. Версия и происхождение — открытые вопросы

- Расхождение `package.json 0.1.0` vs `package-lock.json 0.4.1`: что из этого
  соответствует коду — неизвестно. Нужно спросить у владельца оригинального
  форка или npm-регистра.
- Соответствует ли этот код опубликованному `@unsurf/cs-movement` на npm —
  НЕ ПОДТВЕРЖДЕНО (сети нет).
- Является ли подключённый репозиторий именно тем форком, что использовался в
  игре ранее — проверить невозможно без тега/commit hash от пользователя.

## 3. Внешние эталоны (статус на сейчас)

Ни один внешний эталон в этой среде **не читался**. Планируемые кандидаты:

| Эталон | Что может подтвердить | Чего НЕ подтверждает | Лицензия |
| --- | --- | --- | --- |
| Valve source-sdk-2013 (`game/shared/gamemovement.cpp`) | базовую формулу Accelerate/AirAccelerate/Friction/ClipVelocity эпохи ~2013 | поведение поздней CS:GO (deadstrafe-окно, m_yaw=0.022, jump impulse 301.993 — все это изменения более поздних версий) | Source-1 SDK license (проприетарная, некоммерческое изучение; использовать как *спецификацию*, переписывать по ней аккуратно) |
| Кастомные KZ-серверы (GoKZ/ZeroK cfg: sv_airaccelerate, sv_stamina_*) | режимные значения cs_* | нативное поведение движка | см. ниже GOKZ |
| GOKZ `gokz-zer0k-gamechaos` (bitbucket.org/GameChaos/gokz-zer0k-gamechaos) | логику плагинов KZT/SKZ/Vanilla (таймеры, блокировки, режимные cvar-политики) | то, что плагин лишь *наблюдает* от нативного движка | НЕ ЗАПРОС архив; НЕ ЧИТАЛСЯ. Не начинать порт до проверки лицензии и содержания |

Правило, которое фиксируем: **Source SDK 2013 ≠ спецификация поздней CS:GO.**
Любое числовое значение («как в CS:GO») обязано иметь ссылку на источник и
версию, иначе оно маркируется как гипотеза.

## 4. Заявленные авторами ограничения (из README/комментариев)

- Библиотека позиционируется как «Source-like movement», renderer-agnostic,
  zero runtime deps; headless в Node.
- README прямо говорит, что часть значений — «KZ/HNS-server tuning», а не
  CS:GO-дефолты (например `airAccelerate` default 100 при CS:GO-default 12).
- Нет BSP v21, карт, Entity I/O, jumpstats-измерения — только brush-геометрия
  (AABB/oriented box) и симуляция игрока.
