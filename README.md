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
