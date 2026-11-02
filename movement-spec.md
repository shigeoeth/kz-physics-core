# movement-spec.md — аудит существующего кода (без изменений физики)

Всё ниже восстановлено **по фактическому коду** `/workspace` (коммит `e95d90f`).
Номера ссылок: файл → функция. Ничего не добавлялось «из памяти о Source».

## 0. Система координат и единицы

- Оси: **Y-up** (Three.js). Вертикальная ось Source (`z`) отображена в `y`.
  Подтверждено комментариями в `src/constants.ts` и кодом (`velocity.y`, `origin.y`).
- Единицы: Source units (1 unit = 1 inch); скорость u/s; `dt` в секундах.
- Origin игрока = **feet center** hull-центра снизу: `STAND_MINS=(-16,0,-16)`,
  `STAND_MAXS=(16,72,16)`, duck: высота 54 (`Duck/Duck.config.ts`:
  HULL_HALF_WIDTH=16, HULL_STAND_HEIGHT=72, HULL_DUCK_HEIGHT=54,
  EYE_STAND=64.09, EYE_DUCK=46.04).
- Velocity хранится полной 3D-строкой (`Vec3`), base velocity нет.
  ground reference: только `onGround:boolean` + `groundNormal:Vec3`.
  previous buttons: только `oldJump` (одна кнопка). Лестница: `onLadder:LadderVolume|null`.
  Воды нет вообще.
- wishdir/wishspeed **вычисляются каждый тик** (`WishDir.computeWish`), не хранятся.
- Scratch-векторы переиспользуются (wishDir, moveEnd, tmpA, tmpB, traceResult).

## 1. Реальный pipeline одного тика (`PlayerController.tick(dt)`)

Порядок именно такой (строки 258–313 PlayerController.ts):

1. Снимки `prevPos/prevEye`; потребление wheel-jump (только если `bindInput` вызывался).
2. `input.reset` → `respawn()`.
3. `ladderCooldown -= dt`.
4. `updateDuck(ctx)` — **до** прыжка/движения. Duck в воздухе: origin.y += 18
   (подтяжка ног; в коде комментарий на русском — вероятно локальная правка форка).
   Unduck в воздухе: попытка опустить feet (tryUnduck).
5. `recoverStamina` (если `settings.stamina.enabled`).
6. `checkStuck(ctx)` — если застрял: пропуск всей симуляции тика (velocity=0).
7. `checkLadder(ctx)` → если лестница: `ladderMove` и выход (без gravity/jump-цепочки).
8. Иначе:
   a. `checkJump(ctx)` (см. §3)
   b. if onGround → `walkMove(ctx, dt)`; `groundTicksSinceLanding++`
      else → `fallVelocity = -velocity.y`; `airMove(ctx, dt)`
   c. `categorizePosition(ctx)` — ground probe после движения
9. `detectBlockedMove(ctx)` — анти-залипатель (может обнулить velocity).
10. `landPunch` decay; `oldJump = input.jump`; запись TickHistory; duckFrac lerp;
    `currPos/currEye` snapshot.

Замечания по порядку vs Source:
- Gravity применяется **внутри airMove** двумя половинками вокруг tryPlayerMove
  (`AirMove.ts`: `-0.5*G*dt` до и после) — это совпадает с схемой Source
  (StartGravity/SubtractGravity вокруг TryPlayerMove) по идее, но детали
  (например, применялась ли половина гравитации к air-acceleration в нативном
  порядке) требуют сверки с эталоном.
- Jump НЕ делает отдельного trace для проверки头顶 clearance — impulse
  применяется безусловно (`velocity.y = JUMP_VELOCITY`).
- Нет `surfaceFriction`-конвейера из BSP (значения хардкод: FRICTION=5, ACCELERATE=6.5).

## 2. Input / wish direction

- `MovementContext.InputState`: forward/back/left/right/jump/duck/walk/reset (boolean).
- `WishDir.computeWish`: fmove/smove ∈ {-1,0,1}; wishdir из yaw (0° = -Z);
  диагонали **нормализуются**, затем wishspeed = min(len·maxspeed, maxspeed)
  ⇒ при W+D wishspeed = maxspeed (как в Source).
- Ground wishspeed cap = currentMaxSpeed; Air тот же wishspeed, но в
  `airAccelerate` further capped to 30 (`AIR_SPEED_CAP`) для addspeed,
  при этом accelspeed использует **некапанный** wishspeed — заявлено как
  асимметрия Source (проверить по эталону).

## 3. Прыжок (`Jump/Jump.ts`, Jump.config.ts)

- `JUMP_VELOCITY = sqrt(2·800·57) ≈ 301.993` (JUMP_HEIGHT=57).
- Gate: `onGround && input.jump`; если `!autobhop` — требуется свежий press
  (`!oldJump`). Autobhop: re-hop каждый grounded tick.
- `bhopSpeedClamp=true`: горизонталь режется до `1.1 × currentMaxSpeed`
  (=275 при runSpeed 250) перед impulse.
- `perf.enabled`: «perfect bhop carry» — restores `landingVelocity.x/z` при
  ручном вводе + rejump на первом grounded tickе (groundTicksSinceLanding==0)
  + не после surf. Это **скрытая корректировка скорости на takeoff**.
- Stamina (default off): penalty множитель на jump velocity + cost.
- Duck влияет на LJ только через смену hull/unduck-механику, отдельной
  crouch-jump формулы нет.

## 4. Воздух (`AirMove.ts`, `physics/AirAccelerate.ts`)

- airAccelerate: wishspd cap 30; addspeed = wishspd − dot(vel,wishdir);
  accelspeed = airaccel · wishspeed(некапанный) · dt · surfaceFriction.
- **Подтверждённая особенность**: здесь `surfaceFriction = 0.25`, когда
  `0 <= vel.y <= 140` («deadstrafe окно»). Комментарий автора ссылается на
  CS:GO-поведение, но реализация отличается от канона: в нативном движке
  фактор берётся от ground surface friction при взлёте и хранится, а тут —
  жёсткое условие по vel.y внутри чистой функции. Это влияет и на тесты
  (см. §8). Статус соответствия CS:GO: ГИПОТЕЗА, требует эталона.
- wishdir строится по текущему yaw ⇒ полный контроль над проекцией;
  ограничений итоговой скорости в воздухе нет (кроме perf-cap, см. §7).
- `applyAirSpeedCeiling` (soft clamp к perf.maxAirSpeed=390) активен только при `perf.enabled`.

## 5. Земля (`WalkMove.ts`)

- `velocity.y = 0` → friction(FRICTION=5, STOP_SPEED=100) → accelerate(ACCELERATE=6.5)
  → y=0 снова.
- `noPrestrafe=true` (default!): hard cap горизонтали до currentMaxSpeed каждый
  grounded tick. Это **не дефолт ни CS:GO, ни большинства KZ-серверов** — режимная
  настройка, встроенная в библиотеку как default true.
- `stepMove` (StepMove.ts): direct vs up(18)-move-down, выбор по большей
  горизонтальной дистанции; отказ step-up при land-on-steep; вертикальная
  velocity берётся из direct-варианта.
- `stayOnGround`: trace down на STEP_HEIGHT, snap к hit endPos (ground snapping).

## 6. Коллизии (`physics/Collision.ts`, `TryPlayerMove.ts`)

- Мир = список выпуклых brush'ей (плоскости), built only from AABB/oriented box.
  BSP v21 нет. Broadphase SpatialGrid (XZ, cell 256) при ≥48 brush.
- Trace: Minkowski-расширение плоскостей под hull, clip сегмента (Quake2-style).
  Результат: fraction, normal, endPos, startSolid, allSolid. DIST_EPSILON=1/32.
- tryPlayerMove: до 4 bump-итераций, ≤5 clip-плоскостей, crease-slide при 2
  плоскостях, overbounce 1.001 (обычный) / 1.0 (surf-normal 0.05<ny<0.7),
  anti-duplicate плоскостей (dot>0.99), stop при отскоке назад (dot(v,primal)≤0),
  zero velocity при allSolid / overflow / cornered.
- `surfing` выставляется внутри tryPlayerMove по нормали контакта;
  `STANDABLE_NORMAL=0.7` (~45.57°) — порог ground vs surf.
- categorizePosition: trace down GROUND_TRACE_DIST=2; ground iff fraction<1,
  !startSolid, normal.y ≥ 0.7; snap origin к tr.endPos; при wasAirborne —
  сброс groundTicksSinceLanding, snapshot landingVelocity, stamina landCost,
  viewPunch (опционально). NON_JUMP_VELOCITY=180: вверх быстрее ⇒ не ground.
- Нет: multi-brush contact ordering beyond plane list, no ramp-over-edge
  special-case кроме stayOnGround; seams зависят от точности brush-геометрии.

## 7. Прочие механики

- autobhop (default **true**), bhopSpeedClamp (default true), noPrestrafe
  (default true), airAccelerate default **100** (CS:GO-defolt 12 — README сам
  это признаёт), runSpeed 250 / walk 130 / crouch 85, gravity 800, mYaw 0.022.
- Stamina default off; Perf default off.
- StuckCheck: pop по 10 направлениям × дистанции {1,2,4,8,16,34}; hopeless →
  velocity=0. BlockedMove: pinned 3 тика со speed>150 → velocity=0.
  Обе — скрытые корректировки состояния (логируются в ctx.log).
- Ladder: LADDER_SPEED=200, fastclimb-механика (ненормированные оси), jump-off 270.
- **Jump distance / takeoff-landing измерителя нет.** `landingVelocity` —
  только для perf-carry. Никаких hull-width corrections для дистанции нет
  и быть не может — их надо строить снаружи.

## 8. Что подтверждено как ДЕФЕКТЫ/РИСКИ (не гипотезы)

1. **Тесты падают из коробки** (`npx vitest run`, реально выполнено):
   - `AirAccelerate.test.ts` «uses UNCAPPED wishspeed…» ожидает 23.4375,
     получает 5.859375 — ровно потому, что deadstrafe factor 0.25 умножает
     accelspeed при vel.y∈[0,140] (тест стартует с vel.y=0). Код и тест
     противоречат друг другу; зафиксировано состоянием репозитория.
   - `WalkMove.test.ts` «noPrestrafe off … > 300» получает 255.9 —
     ожидаемое поведение ground-turn gain недостижимо с текущим трением.
   То есть baseline репозитория **не зелёный**; это важно для Этапа 0.
2. package.json version 0.1.0 vs committed lockfile 0.4.1 — внутреннее
   несоответствие версий.
3. `DEFAULT_SETTINGS.autobhop=true, noPrestrafe=true, airAccelerate=100` —
   дефолты НЕ соответствуют ни vanilla CS:GO, ни нейтральному «CS:GO base»;
   это chasemod/KZ-гибрид. Любые измерения «на дефолтах» измеряют этот гибрид.
4. Deadstrafe factor привязан к мгновенному vel.y, а не к состоянию взлёта —
   даже если цель была воспроизвести CS:GO, способ это не воспроизводит
   (при nscramble/low-gravity далёк от реальности). Требует решения: удалить
   или переписать на takeoff-sampled surface friction.
5. Duck unduck в воздухе изменяет `origin.y` напрямую без trace коррекции
   velocity — потенциальный источник скачков позиции (проверить harness'ом).

## 9. Гипотезы о расхождении Long Jump (НЕ доказаны)

- Наблюдаемые 280–282 u в основном проекте могут объясняться поверх-библиотечным
  prestrafe/velmod и post-tick коррекцией, а не ядром. Локальные прогоны
  (`/tmp/lj*.mjs`, выполнены): LJ-подобная цепочка на дефолтах даёт ~204 u
  при takeoffV=275 (clamp работает); при `bhopSpeedClamp=false` takeoffV
  сохраняется 316 → dist 234. Дистанция сильно зависит от конфигурации
  clamp/prestrafe, т.е. от настроек и интеграции, а не только от ядра.
- Само число 280–282 недостижимо в чистом flat-ground LJ на этих дефолтах —
  значит либо в игре другие параметры, либо measurement другой (точка takeoff,
  hull correction, спуск/подъём высоты). Проверить на реальном проекте.
