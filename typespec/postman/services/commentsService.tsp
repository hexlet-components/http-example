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
  op create(...NewCommentDto): Comment;

  @useAuth(BearerAuth)
  @patch
  op update(@path  id: string, ...EditCommentDto): Comment;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void;
}
