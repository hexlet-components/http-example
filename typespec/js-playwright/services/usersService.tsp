// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/resources.js.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// а запрос несуществующей записи отвечает 404.
import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Users")
@route("/users")
interface UserService {
  @get
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string[]
  ): Users;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): User | NotFoundResponse;

  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewUserDto): CreatedResponse & User;

  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditUserDto): User | NotFoundResponse;
 
  @delete
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
