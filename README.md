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

## Страницы для UI-тестов

Курсы Selenium и Playwright открывают учебные страницы под префиксом своего курса: `/java-selenium`, `/python-selenium`, `/python-playwright`. Страницы у всех одни, ссылки внутри и сессия у каждого курса свои. Уроки ищут на страницах элементы и проверяют тексты дословно, поэтому локаторы и надписи тоже контент курса. В таблице префикс курса обозначен `<курс>`.

| Путь | Что на странице |
| --- | --- |
| `/<курс>` | `h1` «Welcome to UI testing» и ссылки на примеры |
| `/<курс>/login` | форма `#login` с полями `#username` и `#password`, учётка `student` / `secret123` |
| `/<курс>/secure` | закрытый раздел, флеш `#flash`, меню `#menu-button` и ссылка на выход |
| `/<курс>/hovers` | карточки `.figure`, подпись `.figcaption h5` видна при наведении |
| `/<курс>/drag_and_drop` | колонки `#column-a` и `#column-b`, перетаскивание на событиях мыши |
| `/<курс>/key_presses` | поле `#target`, результат в `#result` |
| `/<курс>/javascript_alerts` | кнопки `jsAlert()`, `jsConfirm()` и `jsPrompt()` |
| `/<курс>/windows` | ссылка «Click Here» открывает новое окно |
| `/<курс>/iframe` | фрейм `editor-frame` с абзацем `#content` |

Вход и закрытый раздел собирает `custom-server/src/ui-pages.ts`, остальные страницы лежат шаблонами в `custom-server/assets/ui-pages/`, префикс в них записан как `{{prefix}}`. Список курсов задаёт `courses` в том же модуле.

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
