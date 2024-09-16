import "@typespec/http";
import "@typespec/rest";
import "../models/comment.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace ForumService;

@tag("Comments")
@route("/comments")
interface CommentService {
  @get
  op list(
    @query skip?: integer,
    @query limit?: integer = 30,
    @query select?: string
  ): Comments | Error;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Comment | Error;

  @useAuth(BearerAuth)
  @post
  op create(...CommentDto): Comment | Error;

  @useAuth(BearerAuth)
  @patch
  op update(...CommentDto): Comment | Error;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void | Error;
}
