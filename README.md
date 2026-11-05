# Backend Project

NestJS REST API для пользователей, аутентификации, аватаров и переводов баланса. Использует PostgreSQL, Redis, Bull и S3-совместимое хранилище MinIO.

## Стек

- NestJS, TypeScript, `class-validator`, Zod
- PostgreSQL + Kysely; схема меняется миграциями
- JWT access tokens и одноразовые refresh tokens
- Redis: кэш и Bull queue backend
- Bull worker и cron задачи запускаются внутри процесса NestJS
- MinIO через AWS S3 SDK для файлов аватаров
- Pino через `nestjs-pino`; request id через `nestjs-cls`
- Vitest, Supertest, Oxlint, Husky

## Возможности

- Регистрация, вход, выход, ротация refresh token, профиль текущего пользователя
- Список пользователей с поиском и пагинацией, обновление и soft delete
- Загрузка JPEG/PNG аватаров до 10 MiB, максимум пять активных файлов на пользователя
- Soft delete аватаров и фоновое удаление файлов и записей после срока хранения
- Список активных пользователей с последним активным аватаром
- Перевод баланса с блокировкой строк в транзакции
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

Compose запускает PostgreSQL, MinIO и Redis. Для остановки контейнеров:

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

Команда собирает приложение и применяет все неприменённые миграции из `src/databases/migrations`. Её можно безопасно запускать повторно.

### 5. Запустить API и фонового worker

```bash
npm run start:dev
```

HTTP API, Bull processors и cron задачи работают в одном процессе NestJS. Отдельный процесс worker в текущей конфигурации не запускается. API: <http://localhost:3000>; Swagger: <http://localhost:3000/api>.

Для production:

```bash
npm run build
npm run start:prod
```

## Переменные окружения

Полный актуальный список находится в `.env.example`; переменные проверяются Zod при старте.

| Переменная                                                                              | Назначение                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PORT`                                                                                  | Порт HTTP API, по умолчанию `3000`                                     |
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
| `POST`   | `/avatars/cleanup` | Поставить просроченные аватары в очередь | Access token |
| `POST`   | `/balance-reset`   | Поставить обнуление балансов в очередь   | Access token |

Точные схемы запросов, ограничения и ответы доступны в Swagger UI.

## Фоновые задачи и логи

- Cron по `AVATAR_CLEANUP_CRON` ищет soft-deleted аватары старше `AVATAR_CLEANUP_RETENTION_DAYS` и ставит их в Bull queue.
- `POST /avatars/cleanup` запускает ту же постановку jobs вручную и сразу возвращает ответ.
- Worker сначала удаляет объект из MinIO, затем удаляет запись БД. Ошибка удаления файла оставляет запись для повтора Bull.
- Сброс балансов ставится в Bull queue; фиксированный job id предотвращает одновременную постановку одинаковой ожидающей задачи. Само обнуление идемпотентно.
- Pino пишет структурированные логи начала, результата и ошибок фоновых задач. Заголовок `Authorization`, пароли и токены не должны попадать в логи.
- `x-request-id` принимается из входящего заголовка либо генерируется; возвращается в response header.

## Завершение процесса

Приложение включает Nest shutdown hooks. При `SIGTERM` Nest закрывает HTTP server и providers: PostgreSQL pool, Redis и S3 client. Bull queue providers закрываются при остановке Nest; processor пробрасывает ошибку, чтобы Bull мог повторить неуспешную задачу.

```bash
kill -TERM <pid>
```

## Проверки

```bash
npm test       # unit tests
npm run test:e2e
npm run lint
npm run build
```

Pre-commit hook запускает `lint-staged` для staged файлов.

## Структура проекта

```text
src/
├── auth/                         # login, logout, refresh, JWT и guards
│   ├── decorators/               # @Public
│   ├── dto/                      # DTO авторизации
│   ├── helpers/                  # хеширование паролей и токенов
│   └── types/                    # типизированный authenticated request
├── avatars/                      # API, бизнес-логика и repository аватаров
│   ├── avatar-cleanup.service.ts  # выбор просроченных записей и enqueue
│   ├── avatars.controller.ts
│   ├── avatars.repository.ts
│   └── avatars.service.ts
├── common/                       # exception filter и общие helpers
├── configs/                      # registerAs-конфиги и Zod env validation
├── cron/                         # расписания фоновых задач
├── databases/                    # Kysely connection, types и migrations
│   └── migrations/                # последовательные изменения схемы
├── features/
│   ├── profile/                  # профиль текущего пользователя
│   ├── refresh-tokens/           # хранение и ротация refresh tokens
│   └── users/                    # users API, сервис, repository и DTO
├── queues/                       # Bull queues и processors
│   ├── avatar-deletion/          # очистка файлов аватаров
│   └── balance-reset/            # сброс балансов
├── redis/                        # Redis client и операции кэша
├── storage/                      # S3/MinIO client и файловые операции
├── app.module.ts                 # сборка модулей и cross-cutting providers
└── main.ts                       # bootstrap, Swagger, pipes и shutdown hooks
test/                             # e2e tests
```

Миграции применяются только через `npm run migrate`; не используй автоматическую синхронизацию схемы.
