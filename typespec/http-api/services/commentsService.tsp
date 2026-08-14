import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/comment.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;
using TypeSpec.Rest;

namespace AppService;

@tag("Comments")
@route("/comments")
interface CommentService {
  @get
  @operationId("commentServiceList")
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Comments;

  @get
  @operationId("commentServiceGet")
  op get(
    @path
    id: string,
    @query select?: string
  ): Comment | NotFoundResponse;

  @useAuth(BearerAuth)
  @post
  @operationId("commentServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewCommentDto): CreatedResponse & Comment;

  @useAuth(BearerAuth)
  @patch
  @operationId("commentServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path  id: string, ...EditCommentDto): Comment | NotFoundResponse;

  @useAuth(BearerAuth)
  @delete
  @operationId("commentServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
