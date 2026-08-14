// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/post.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;
using TypeSpec.Rest;

namespace AppService;

@tag("Posts")
@route("/posts")
interface PostService {
  @get
  @operationId("postServiceList")
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Posts;

  @get
  @operationId("postServiceGet")
  op get(
    @path id: string,
    @query select?: string
  ): Post | NotFoundResponse;

  @useAuth(BearerAuth)
  @post
  @operationId("postServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewPostDto): CreatedResponse & Post;

  @useAuth(BearerAuth)
  @patch
  @operationId("postServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditPostDto): Post | NotFoundResponse;

  @useAuth(BearerAuth)
  @delete
  @operationId("postServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;

  @route("/{postId}/comments")
  @operationId("postServiceGetComments")
  op getComments(
    @path postId: string,
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Comments;
}
