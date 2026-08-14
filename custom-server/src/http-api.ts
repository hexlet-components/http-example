// Эндпоинты курса HTTP API.
//
// Маршруты, валидация запроса и проверка авторизации не написаны здесь, а
// взяты из спецификации: fastify-openapi-glue строит по ней конфигурацию
// fastify. Спецификация при этом остаётся той же, что читает студент в
// документации, поэтому поведение и документация не могут разъехаться.
//
// Раньше эти же маршруты отдавал мок prism. Мок возвращает пример дословно и
// запрос не разбирает: skip, limit и select не применялись, а на любой
// /tasks/{id} приходила одна и та же запись. Уроки курса учат ровно на этом.
//
// Остаётся здесь только то, чего в спецификации выразить нельзя:
// 405, отображение 400 в 422 и снятие схемы ответа у операций с select.
import glue from 'fastify-openapi-glue';

import serviceHandlers from './handlers.ts';

const SPEC = 'tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml';

// Значения токена и ключа сервер не проверяет, важно только наличие заголовка:
// урок authentication показывает разницу между запросом с ним и без него, а не
// работу настоящей проверки. Схемы взяты из спецификации, там это
// @useAuth(BearerAuth) у постов с комментариями и ApiKeyAuth у курсов.
const securityHandlers = {
  BearerAuth: async (req) => {
    if (!/^Bearer\s+\S/i.test(req.headers.authorization ?? '')) {
      throw new Error('нужен заголовок Authorization с Bearer-токеном');
    }
  },
  ApiKeyAuth: async (req) => {
    if (!req.headers['x-api-key']) {
      throw new Error('нужен заголовок X-API-KEY');
    }
  },
};

export default async (app) => {
  // Схема ответа снимается там, где у операции есть select. OpenAPI не умеет
  // сказать «набор полей ответа зависит от параметра запроса», поэтому
  // сериализатор падает на записи без lastName, хотя ответ верный. Валидация
  // запроса при этом остаётся, снимается только схема ответа.
  app.addHook('onRoute', (route) => {
    const query = route.schema?.querystring?.properties ?? {};
    if ('select' in query && route.schema?.response) {
      delete route.schema.response;
    }
  });

  // Валидация по схеме отвечает 400, а уроки курса учат на 422: урок crud
  // прямо называет 422 кодом ошибки валидации.
  app.setErrorHandler((error, req, res) => {
    if (error.code === 'FST_ERR_VALIDATION') {
      return res.code(422).send({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: error.message,
      });
    }
    return res.send(error);
  });

  await app.register(glue, {
    specification: SPEC,
    serviceHandlers,
    securityHandlers,
    // Пути в спецификации записаны без префикса, он вынесен в servers
    // (@server("/http-api") в TypeSpec). Сам glue servers не применяет.
    prefix: 'http-api',
  });
};
