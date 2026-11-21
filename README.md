# Backend Project

Монорепозиторий NestJS: `user-service` (пользователи, аутентификация, аватары, переводы) и `notification-service` (Socket.io и Kafka). Общий код лежит в `libs/common`. Инфраструктура: PostgreSQL, Redis, Bull, MinIO и Kafka.

## Стек

- NestJS, TypeScript, `class-validator`, Zod
- PostgreSQL + Kysely; схема меняется миграциями
- JWT access tokens и одноразовые refresh tokens
- Redis: кэш и Bull queue backend
- Bull worker и cron задачи запускаются внутри процесса NestJS
- MinIO через AWS S3 SDK для файлов аватаров
- Pino через `nestjs-pino`; request id через `nestjs-cls`
- Kafka и Socket.io для уведомлений о переводах
- Vitest, Supertest, Oxlint, Husky

## Возможности

- Регистрация, вход, выход, ротация refresh token, профиль текущего пользователя
- Список пользователей с поиском и пагинацией, обновление и soft delete
- Загрузка JPEG/PNG аватаров до 10 MiB, максимум пять активных файлов на пользователя
- Soft delete аватаров и фоновое удаление файлов и записей после срока хранения
- Список активных пользователей с последним активным аватаром
- Перевод баланса с блокировкой строк в транзакции
- После успешного перевода user-service публикует событие в Kafka, notification-service шлёт его обоим участникам в комнату `user:{id}`
- Фоновый сброс балансов через Bull
- Redis-кэш пользователя и списка пользователей с TTL 30 секунд
- Swagger UI на `/api`

## Требования

- Node.js 22 или новее (требуется `file-type`)
- npm
- Docker Engine и Docker Compose plugin

## Быстрый запуск

### 1. Установить зависимости и настроить окружение

```bash
npm install
cp .env.example .env
```

Для локального запуска значения из примера подходят. Перед публикацией или развёртыванием замени пароли и JWT secret на уникальные секреты.

### 2. Запустить инфраструктуру

```bash
docker compose up -d
docker compose ps
```

Compose запускает PostgreSQL, MinIO, Redis, Kafka и Kafka UI. Kafka UI: <http://localhost:8080>. Для остановки контейнеров:

```bash
docker compose down
```

Данные сохраняются в именованных Docker volumes. `docker compose down -v` удалит volumes вместе с данными.

### 3. Создать bucket в MinIO

Открой MinIO Console: <http://localhost:9001>. Используй `MINIO_ROOT_USER` и `MINIO_ROOT_PASSWORD` из `.env`, затем создай bucket с именем `MINIO_BUCKET` (по умолчанию `avatars`). API MinIO доступно на порту `MINIO_API_PORT`.

### 4. Применить миграции

```bash
npm run migrate
```

Команда применяет все неприменённые миграции из `apps/user-service/src/databases/migrations`. Её можно безопасно запускать повторно.

### 5. Запустить сервисы

```bash
npm run start:dev
```

Команда поднимает user-service, notification-service и oxlint при изменении файлов в `apps/` и `libs/`. HTTP API, Bull processors и cron задачи user-service работают в одном процессе. Отдельный процесс worker не запускается.

- user-service: <http://localhost:3000>, Swagger: <http://localhost:3000/api>
- notification-service: <http://localhost:3001>
- Socket.io подключается к notification-service. Access token передаётся в `handshake.auth.token`. Клиент попадает в комнату `user:{id}` и слушает событие `notification`

Проверка доставки, когда оба сервиса уже запущены:

```bash
node test-kafka-notifications.mjs
```

Скрипт сам регистрирует отправителя, получателя и третьего пользователя, ставит отправителю баланс `100.00` в Postgres и переводит `10.00`. У нового пользователя баланс `0`, без этого обновления перевод вернёт 400. Пока user-service запущен, cron раз в минуту снова обнуляет балансы, поэтому скрипт пишет баланс прямо перед переводом. Уведомление должны получить только двое участников.

Свои токены можно передать снаружи, все четыре переменные сразу: `SENDER_TOKEN`, `RECIPIENT_TOKEN`, `STRANGER_TOKEN`, `RECIPIENT_ID`. У отправителя на счёте должно быть не меньше `10.00`.

Только один сервис:

```bash
npm run start:dev:user
npm run start:dev:notification
```

Только линтер на изменениях:

```bash
npm run lint:watch
```

Для production:

```bash
npm run build
npm run start:prod
npm run start:prod:notification
```

## Переменные окружения

Полный актуальный список находится в `.env.example`; переменные проверяются Zod при старте.

| Переменная                                                                              | Назначение                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PORT`                                                                                  | Порт user-service, по умолчанию `3000`                                 |
| `NOTIFICATION_PORT`                                                                     | Порт notification-service, по умолчанию `3001`                         |
| `KAFKA_BROKERS`                                                                         | Брокеры Kafka через запятую, по умолчанию `localhost:9092`             |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` | Подключение к PostgreSQL                                               |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`                                                | Учётные данные MinIO/S3                                                |
| `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`                                                  | Порты MinIO в Docker Compose                                           |
| `MINIO_ENDPOINT`, `MINIO_REGION`, `MINIO_BUCKET`                                        | S3 endpoint и bucket                                                   |
| `REDIS_HOST`, `REDIS_PORT`                                                              | Redis для кэша и очередей                                              |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`                                            | Подпись и срок access token                                            |
| `JWT_REFRESH_EXPIRES_IN`                                                                | Срок refresh token                                                     |
| `LOG_LEVEL`                                                                             | Уровень Pino: `error`, `warn`, `info` или `debug`                      |
| `AVATAR_CLEANUP_CRON`                                                                   | Cron-расписание постановки задач очистки                               |
| `AVATAR_CLEANUP_RETENTION_DAYS`                                                         | Сколько дней хранить soft-deleted аватар до удаления; по умолчанию `7` |

## HTTP API

Защищённые endpoints требуют заголовок `Authorization: Bearer <access_token>`.

| Метод    | Путь               | Назначение                               | Доступ       |
| -------- | ------------------ | ---------------------------------------- | ------------ |
| `POST`   | `/users`           | Регистрация и получение токенов          | Публичный    |
| `POST`   | `/auth/login`      | Вход по login и password                 | Публичный    |
| `POST`   | `/auth/refresh`    | Обмен refresh token на новую пару        | Публичный    |
| `POST`   | `/auth/logout`     | Отзыв refresh token                      | Публичный    |
| `GET`    | `/profile/my`      | Профиль текущего пользователя            | Access token |
| `GET`    | `/users`           | Поиск и пагинация пользователей          | Access token |
| `GET`    | `/users/active`    | Активные пользователи и последний аватар | Access token |
| `PATCH`  | `/users/me`        | Обновление профиля                       | Access token |
| `DELETE` | `/users/me`        | Soft delete текущего пользователя        | Access token |
| `POST`   | `/users/transfer`  | Перевод баланса                          | Access token |
| `POST`   | `/avatars`         | Загрузка аватара, multipart поле `file`  | Access token |
| `DELETE` | `/avatars/:id`     | Soft delete своего аватара               | Access token |
| `POST`   | `/avatars/cleanup` | Поставить одну задачу очистки в очередь  | Access token |

Точные схемы запросов, ограничения и ответы доступны в Swagger UI.

## Фоновые задачи и логи

- Cron по `AVATAR_CLEANUP_CRON` и `POST /avatars/cleanup` ставят **одну** задачу очистки в Bull. Processor сам находит soft-deleted аватары старше `AVATAR_CLEANUP_RETENTION_DAYS` и ставит deletion-job на каждый файл.
- HTTP-роут сброса балансов убран; обнуление ставит только cron.
- Worker сначала удаляет объект из MinIO, затем удаляет запись БД. Ошибка удаления файла оставляет запись для повтора Bull.
- Сброс балансов ставится в Bull queue; фиксированный job id предотвращает одновременную постановку одинаковой ожидающей задачи. Само обнуление идемпотентно.
- Pino пишет структурированные логи начала, результата и ошибок фоновых задач. Заголовок `Authorization`, пароли и токены не должны попадать в логи.
- `x-request-id` принимается из входящего заголовка либо генерируется; возвращается в response header. Тот же id user-service кладёт в заголовок Kafka при переводе, notification-service пишет его в логи обработки события.

## Завершение процесса

Приложение включает Nest shutdown hooks. При `SIGTERM` Nest закрывает HTTP server и providers: PostgreSQL pool, Redis и S3 client. Bull queue providers закрываются при остановке Nest; processor пробрасывает ошибку, чтобы Bull мог повторить неуспешную задачу.

```bash
kill -TERM <pid>
```

## Проверки

```bash
npm test      
npm run test:e2e
npm run lint
npm run build
```

Pre-commit hook запускает `lint-staged` для staged файлов. Во время разработки `npm run start:dev` дополнительно гоняет oxlint при изменении файлов в `apps/` и `libs/`.

## Структура проекта

```text
apps/
├── user-service/src/             # пользователи, auth, аватары, переводы, Kafka producer
│   ├── auth/
│   ├── avatars/
│   ├── configs/
│   ├── cron/
│   ├── databases/migrations/
│   ├── features/
│   ├── kafka/
│   ├── queues/
│   ├── redis/
│   └── storage/
└── notification-service/src/     # Socket.io gateway и Kafka consumer
    ├── configs/
    └── notification/
libs/common/src/                  # logger, JWT verification, HttpExceptionFilter, Kafka-контракт
```

Миграции применяются только через `npm run migrate`; не используй автоматическую синхронизацию схемы.
