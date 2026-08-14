// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/resources.js.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// а запрос несуществующей записи отвечает 404.
import "@typespec/http";
import "@typespec/rest";
import "../models/comment.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Comments")
@route("/comments")
interface CommentService {
  @get
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Comments;

  @get
  op get(
    @path
    id: string,
    @query select?: string
  ): Comment | NotFoundResponse;

  @useAuth(BearerAuth)
  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewCommentDto): CreatedResponse & Comment;

  @useAuth(BearerAuth)
  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path  id: string, ...EditCommentDto): Comment | NotFoundResponse;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
