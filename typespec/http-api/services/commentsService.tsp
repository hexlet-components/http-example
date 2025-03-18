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
  ): Comment;

  @useAuth(BearerAuth)
  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewCommentDto): Comment;

  @useAuth(BearerAuth)
  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path  id: string, ...EditCommentDto): Comment;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void;
}
