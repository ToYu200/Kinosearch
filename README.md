
# VK Fullstack Intern Challenge (Movies Edition)

### Скрины проекта

![image](https://github.com/user-attachments/assets/34e5b1f2-6ad2-4798-b4f8-fa672c12b05e)

![image](https://github.com/user-attachments/assets/3beb2f4c-8b4f-40b9-9823-0ce0547d85ce)


## Описание

Фронтенд на React + Vite и бэкенд на NestJS + TypeORM + PostgreSQL. Используется внешний API Кинопоиска для получения информации о фильмах и их постерах.

## Запуск

1. Клонируйте репозиторий
2. Установите зависимости для фронта и бэка:
   - `cd front` `npm install`
   - `cd ../api` ` npm install`
3. Запустите через Docker Compose:
   - `docker compose up --build`
4. Откройте [http://localhost:8080](http://localhost:8080) для фронта

## Возможности
- Просмотр фильмов с внешнего API Кинопоиска
- Добавление/удаление фильмов в избранное
- Адаптивный интерфейс
- Lazy loading фильмов при скролле

---
