// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/post.tsp";
import "../models/comment.tsp";
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

  @useAuth(BearerAuth)
  @patch
  @operationId("userServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditUserDto): User | NotFoundResponse;

  @useAuth(BearerAuth)
  @delete
  @operationId("userServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;

  @route("/{authorId}/posts")
  @operationId("userServiceGetPosts")
  op getPosts(
    @path authorId: string,
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Posts;

  @route("/{authorId}/comments")
  @operationId("userServiceGetComments")
  op getComments(
    @path authorId: string,
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Comments;
}
