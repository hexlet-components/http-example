# http-example

Учебный HTTP-сервер Хекслета: [https://http.hexlet.app](https://http.hexlet.app). На него **живьём ходят студенты** из курсов HTTP API, протокол HTTP, Postman, js-playwright и курсов Selenium и Playwright, а уроки и самостоятельные работы цитируют его ответы дословно, вплоть до значений полей.

Отсюда главное свойство проекта: **ответы сервера это контент курса**, а не деталь реализации. Правка данных здесь делает неверным текст урока в другом репозитории, и по коду это не видно. Поэтому правила работы с проектом собраны в [AGENTS.md](./AGENTS.md), и читать их стоит до первой правки — там же разобрано, почему наборы данных такого размера, почему они не меняются и какие коды ответов несут уроки.

Устройство короткое: четыре спецификации на TypeSpec (`typespec/<app>/`, по одной на курс) компилируются в OpenAPI, а маршруты, валидацию и авторизацию строит из них `fastify-openapi-glue`. Руками написаны только данные и то, что в OpenAPI не выражается. Значит документация и поведение разъехаться не могут: студент читает ту же спецификацию, по которой работает сервер.

## Примеры форматов тела

Урок `body-formats` курса HTTP для автоматизации использует следующие адреса. Обработчики показывают полученные данные без сохранения задач.

| Метод и путь | Результат |
| --- | --- |
| `GET /http-protocol/form` | HTML-форма с полями `title` и `description` |
| `POST /http-protocol/form` | Полученные значения обоих полей обычным текстом |
| `POST /http-protocol/body` | JSON с заголовками запроса и данными в `json`, `form` или `files` |
| `GET /http-protocol/image.png` | Файл PNG размером 8090 байтов |

Обработчик `body` принимает JSON, `application/x-www-form-urlencoded` и multipart. Для примера с файлом он возвращает его содержимое как строку UTF-8. Лимиты multipart допускают один файл до 64 КиБ и до десяти текстовых полей по 4 КиБ. Исходное тестовое изображение взято из [httpbin](https://httpbin.org/image/png), который распространяется под [лицензией MIT](https://github.com/postmanlabs/httpbin/blob/master/LICENSE).

## Учебные приложения для UI-тестов

Курсы Selenium и Playwright тестируют маленькие приложения под префиксом своего курса. У каждого своя предметная область, и страницы в нём появились из её сценариев. Уроки ищут элементы и проверяют тексты дословно, поэтому локаторы и надписи этих страниц тоже контент курса.

**`/java-selenium`, библиотека City Library.** Курс разбирает действия пользователя, окна и фреймы, и у каждого действия в библиотеке есть смысл.

| Путь | Сценарий |
| --- | --- |
| `/java-selenium` | каталог, `h1` «City Library» |
| `/java-selenium/login` → `/my-shelf` | вход читателя `reader` / `books123`, полка с выданными книгами |
| `/java-selenium/covers` | обложки `.figure`, название `.figcaption h5` видно при наведении, двойной клик добавляет книгу в избранное |
| `/java-selenium/shelves` | книга `#book-moby-dick` перетаскивается на полку `#shelf-reading` |
| `/java-selenium/search` | поиск `#search` фильтрует каталог, Enter печатает число найденного в `#result` |
| `/java-selenium/return` | кнопка `#return-book` спрашивает `confirm` перед возвратом |
| `/java-selenium/preview` | «Open preview» открывает отрывок в новом окне |
| `/java-selenium/reader` | глава книги во фрейме `chapter`, абзац `#content` |

**`/python-selenium`, трекер Task Board.** Курс разбирает сессию, куки, ожидания и мобильное меню.

| Путь | Сценарий |
| --- | --- |
| `/python-selenium` | промо-страница, первая ссылка «Sign in» после названия |
| `/python-selenium/login` → `/tasks` | вход `student` / `tasks123`, список задач, меню `#menu-button` с пунктами `.menu-item` |

**`/python-playwright`, табло Departures.** Курс настраивает контекст браузера, и табло на эти настройки отвечает.

| Путь | Сценарий |
| --- | --- |
| `/python-playwright` | табло `#departures`, время вылета печатается в часовом поясе браузера, на узком экране строки складываются в карточки |
| `/python-playwright/login` → `/trips` | вход пассажира `passenger` / `flight123`, «My trips» |

У всех трёх одинаковое устройство входа. Форма `#login` с полями `#username` и `#password` и кнопкой `button.primary[data-test=login-button]`, флеш-сообщение `#flash`, выход по `/<курс>/logout`. Приложения описаны конфигом `apps` в `custom-server/src/ui-pages.ts`, страницы лежат фрагментами в `custom-server/assets/ui-pages/<курс>/`, префикс в них записан как `{{prefix}}`.

## Демонстрации HTTP для автоматизации

Курс использует отдельные обработчики сессии, кеширования, событий и повторных запросов. Общие коллекции задач, пользователей и публикаций сохраняются.

| Метод и путь | Результат |
| --- | --- |
| `GET /http-protocol/login-form` | Форма с учебным именем `student` |
| `POST /http-protocol/session` | Куки `session=hexlet-demo` на пять минут |
| `GET /http-protocol/session` | `Guest` без куки, `Welcome, student!` с учебной куки |
| `DELETE /http-protocol/session` | Удаление куки клиента |
| `GET /http-protocol/cache` | Расписание, `ETag` и `private, max-age=60` |
| `GET /http-protocol/cache/revalidate` | То же расписание с `no-cache` |
| `GET /http-protocol/cache/no-store` | То же расписание с `no-store` |
| `POST /http-protocol/webhooks/inboxes` | Новый приёмник, его `callback_url` и `events_url` |
| `POST /http-protocol/webhooks/inboxes/{id}/subscription` | Подписка с полученным `callback_url` |
| `POST /http-protocol/webhooks/inboxes/{id}/trigger` | Отправка учебного события настоящим HTTP-запросом в свой приёмник |
| `GET /http-protocol/webhooks/inboxes/{id}/events` | Сохранённые входящие сообщения и ответы приёмника |
| `POST /http-protocol/reliability/runs` | Новый отдельный опыт с `run_id` и `base_url` |
| `GET {base_url}/temporary` | Первый ответ 503 с `Retry-After: 1`, следующий 200 |
| `GET {base_url}/limited` | 429 с `Retry-After: 1`, после ожидания 200 |
| `GET {base_url}/slow` | Ответ через две секунды для проверки таймаута |
| `POST {base_url}/operations?lose_response=1` | Создание операции с обрывом связи до ответа |
| `GET {base_url}/operations` | Результаты созданных операций |
| `GET {base_url}/journal` | Связь попыток с результатами операций |

Вебхуки принимают только подготовленные поля события. Подписка допускает приёмник этого же опыта, произвольные внешние адреса не вызываются. Реальный HTTP-запрос идёт на локальный порт приложения, за тем же публичным адресом. Получатель проверяет учебный `X-Webhook-Key: hexlet-demo-webhook` и подтверждает сохранение сообщения кодом 204. Этот общедоступный пример показывает форму проверки источника, настоящие учётные данные не используются.

При создании операции поле `title` обязательно. Если `Idempotency-Key` повторяется с тем же названием, сервер возвращает существующую операцию. Другое название под тем же ключом даёт 409. Без ключа каждый запрос создаёт отдельную запись. Параметр `lose_response=1` закрывает соединение после записи новой операции; уже найденная по ключу операция возвращается обычным ответом. При обращении через Caddy первый обрыв превращается в ответ 502 без результата операции. Это тоже оставляет клиенту задачу проверить, было ли изменение выполнено.

Приёмник и опыт живут 30 минут, данные хранятся только в памяти. Число опытов и размеры журналов ограничены. После истечения срока или перезапуска создаётся новый опыт. Фиксированный маркер сессии служит для демонстрации обмена куки, проверку настоящего аккаунта он не выполняет.

## Prerequisites

- [mise](https://mise.jdx.dev) (ставит Node, pnpm, Caddy и jactionlint по `mise.toml`)
- Docker (только для `compose:*`)

## Commands

```bash
mise run setup           # зависимости и компиляция спецификаций
mise run check           # типы, линтеры, сгенерированное, тесты
mise run test            # только тесты, против всех четырёх префиксов
mise daemons start       # приложение и Caddy на http://localhost:8080
mise run compose:build
mise run compose:up      # http://localhost:8080
```

Остальные задачи: `mise tasks`.

---

[![Hexlet Ltd. logo](https://raw.githubusercontent.com/Hexlet/assets/master/images/hexlet_logo128.png)](https://hexlet.io?utm_source=github&utm_medium=link&utm_campaign=http-example)

This repository is created and maintained by the team and the community of Hexlet, an educational project. [Read more about Hexlet](https://hexlet.io?utm_source=github&utm_medium=link&utm_campaign=http-example).
