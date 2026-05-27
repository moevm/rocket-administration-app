# rocket-administration-app

RocketManager (Rocket Administration App, RocketAdmin) - веб-приложение для удобного администрирования пространств в
RocketChat

## Prod-версия

### Пререквизиты

- `docker`

### Запуск

Алгоритм:

1. Склонировать репозиторий

```bash
git clone https://github.com/moevm/rocket-administration-app.git
```

2. Перейти в директорию `deployment/prod`

```bash
cd rocket-administration-app/deployment/prod
```

3. (Опционально) Настроить порты на которых будут работать фронтенд и бэкенд, изменив переменные среды, указанные в
   файле `.env`
4. Запустить через `docker compose`

```bash
docker compose up -d
```

##### Примечание

При изменении переменных среды обязательно необходимо пересобрать докер-контейнеры

```
docker compose build --no-cache
```

### Остановка

Алгоритм:

1. Перейти в директорию `deployment/prod`

```bash
cd rocket-administration-app/deployment/prod
```

2. Остановить контейнеры через `docker compose`

```bash
docker compose stop
```

## Dev-версия

### Пререквизиты

- `docker`
- `python >= 3.13`
- `uv`
- `bun`

### Запуск

Алгоритм:

1. Склонировать репозиторий (если еще нет)

```bash
git clone https://github.com/moevm/rocket-administration-app.git
```

2. Перейти в директорию `deployment/dev`

```bash
cd rocket-administration-app/deployment/dev
```

3. Перейти на ветку `development`

```bash
git checkout development
```

4. Запустить через `docker compose`

```bash
docker compose up -d
```

5. Перейти в директорию `backend`

```bash
cd ../../backend
```

6. Запустить бэкенд-сервер

```bash
uv run fastapi dev
```

7. Перейти в директорию `frontend`

```bash
cd ../frontend
```

8. Установить зависимости фронтенд-сервера

```bash
bun install
```

9. Запустить фронтенд-сервер

```bash
bun run dev
``` 

### Настройка тестового окружения RocketChat

#### 0. Обход облачной регистрации пространства

По умолчанию, RocketChat при первом запуске предлагает зарегистрировать пространство в облаке, что может быть
нежелательно для тестирования. Обход регистрации меняется от версии к версии, данный алгоритм протестирован на версии
`rocket.chat:8.4.0`.

0. Перейти в директорию `deployment/dev`

```bash
cd rocket-administration-app/deployment/dev
```

1. Убедиться, что контейнер с RocketChat запущен и healthy
2. Подключиться к контейнеру с MongoDB

```bash
docker compose exec mongodb mongosh
```

3. Выбрать базу данных `rocketchat`

```bash
use rocketchat
```

4. Выполнить обход

```javascript
db.rocketchat_settings.updateOne(
    {"_id": "Show_Setup_Wizard"},
    {
        $set: {
            "value": "completed",
            "valueSource": "db"
        }
    }
);
```

5. Выйти из терминала контейнера, перезапустить все контейнеры

```bash
docker compose restart
```

#### 1. Получить token и userId для RocketManager

1. Войти в RocketChat с аккаунта администратора
2. Перейти в раздел "Учетная запись" → "Настройки" → "Токены для личного доступа" (`/account/tokens`)
3. Добавить токен для личного доступа, выбрав "Игнорировать двухфакторную авторизацию" (**важно**)
4. Сохранить token и userId для дальнейшего использования в RocketManager

#### 2. Включение бесконечной пагинации

1. Войти в RocketChat с аккаунта администратора
2. Перейти в "Рабочее пространство" → "Настройки" → "Общие настройки" (`/admin/settings/General`)
3. В пункте REST API включить настройку "Разрешить получить всё" (если еще не включено)

#### 3. Выдать роли администратора все права:

1. Войти в RocketChat с аккаунта администратора
2. Перейти в "Рабочее пространство" → "Права доступа" (`/admin/permissions`)
3. Выдать роли Admin (или, при наличии, специально выделенной для аккаунта который будет использоваться с RocketManager)
   все права

### Maintenance и обновление версий

#### RocketChat (и MongoDB)

При обновлении мажорной версии RocketChat нужно обновлять и MongoDB (требование RocketChat). Таблица совместимости
версий RocketChat и MongoDB доступна по [ссылке](https://docs.rocket.chat/docs/support-prerequisites). При обновлении
мажорной версии MongoDB необходимо провести миграцию, обновив параметр `fcv`. Алгоритм и более подробную информацию
можно найти в [issue](https://github.com/moevm/rocket-administration-app/issues/177).