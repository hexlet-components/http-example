// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "../models/error.tsp";
import "../models/auth.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace AppService;

@tag("Auth")
@route("/login")
interface AuthService {
  @post
  @operationId("authServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...AuthData): CreatedResponse & AuthToken;
}
