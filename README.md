# http-example

Учебный HTTP-сервер Хекслета: [https://http.hexlet.app](https://http.hexlet.app). На него **живьём ходят студенты** из курсов HTTP API, протокол HTTP, Postman и js-playwright, а уроки и самостоятельные работы цитируют его ответы дословно, вплоть до значений полей.

Отсюда главное свойство проекта: **ответы сервера это контент курса**, а не деталь реализации. Правка данных здесь делает неверным текст урока в другом репозитории, и по коду это не видно. Поэтому правила работы с проектом собраны в [AGENTS.md](./AGENTS.md), и читать их стоит до первой правки — там же разобрано, почему наборы данных такого размера, почему они не меняются и какие коды ответов несут уроки.

Устройство короткое: четыре спецификации на TypeSpec (`typespec/<app>/`, по одной на курс) компилируются в OpenAPI, а маршруты, валидацию и авторизацию строит из них `fastify-openapi-glue`. Руками написаны только данные и то, что в OpenAPI не выражается. Значит документация и поведение разъехаться не могут: студент читает ту же спецификацию, по которой работает сервер.

## Prerequisites

- Make
- Docker

## Commands

```bash
make setup           # зависимости и компиляция спецификаций
make test            # прогон против всех четырёх префиксов
make compose-build
make compose         # http://localhost:8080
```

Остальные цели — в [Makefile](./Makefile).

---

[![Hexlet Ltd. logo](https://raw.githubusercontent.com/Hexlet/assets/master/images/hexlet_logo128.png)](https://hexlet.io?utm_source=github&utm_medium=link&utm_campaign=http-example)

This repository is created and maintained by the team and the community of Hexlet, an educational project. [Read more about Hexlet](https://hexlet.io?utm_source=github&utm_medium=link&utm_campaign=http-example).
