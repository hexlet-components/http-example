// Эндпоинты одной спецификации. Плагин регистрируется по разу на каждую из
// четырёх: http-api, http-protocol, js-playwright, postman. Имя приходит
// параметром, список лежит в app.config.json, он же задаёт маршруты документации.
//
// Маршруты, валидация запроса и проверка авторизации не написаны здесь, а
// взяты из спецификации: fastify-openapi-glue строит по ней конфигурацию
// fastify. Спецификация при этом остаётся той же, что читает студент в
// документации, поэтому поведение и документация не могут разъехаться.
//
// Отдельным плагином на спецификацию, а не одним на все: внутри свой обработчик
// ошибок и свои хуки, и они должны действовать только на маршруты этой
// спецификации.
//
// Раньше эти же маршруты отдавал мок prism. Мок возвращает пример дословно и
// запрос не разбирает: skip, limit и select не применялись, а на любой
// /tasks/{id} приходила одна и та же запись. Уроки курса учат ровно на этом.
//
// Остаётся здесь только то, чего в спецификации выразить нельзя:
// 405, отображение 400 в 422 и снятие схемы ответа у операций с select.
import glue from 'fastify-openapi-glue';

import serviceHandlers from './handlers.ts';

// Обработчики одни на все четыре спецификации: имена интерфейсов в них совпадают,
// поэтому совпадают и operationId, а js-playwright просто подмножество, у него нет
// постов и комментариев. Лишние ключи glue не смотрит, а отсутствующий обработчик
// он находит на старте и падает громко.

// Значения токена, ключа и пароля сервер не проверяет, важно только наличие
// заголовка: урок authentication показывает разницу между запросом с ним и без
// него, а не работу настоящей проверки. Схемы взяты из спецификаций, там это
// @useAuth(BearerAuth) у постов с комментариями, ApiKeyAuth у курсов и BasicAuth
// у задач курса Postman. Basic встречается только там, и снимать его нельзя:
// урок про авторизацию в Postman разбирает именно этот способ.
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
  BasicAuth: async (req) => {
    if (!/^Basic\s+\S/i.test(req.headers.authorization ?? '')) {
      throw new Error('нужен заголовок Authorization со схемой Basic');
    }
  },
};

export default async (app, { name }) => {
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
    specification: `tsp-output/${name}/@typespec/openapi3/openapi.1.0.yaml`,
    serviceHandlers,
    securityHandlers,
    // Пути в спецификации записаны без префикса, он вынесен в servers
    // (@server("/http-api") в TypeSpec). Сам glue servers не применяет.
    prefix: name,
  });
};
