// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.OpenAPI;
using TypeSpec.Rest;

namespace AppService;

@tag("Users")
@route("/users")
interface UserService {
  @get
  @operationId("userServiceList")
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string[]
  ): Users;

  @get
  @operationId("userServiceGet")
  op get(
    @path id: string,
    @query select?: string
  ): User | NotFoundResponse;

  @post
  @operationId("userServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewUserDto): CreatedResponse & User;

  @patch
  @operationId("userServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditUserDto): User | NotFoundResponse;
 
  @delete
  @operationId("userServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
