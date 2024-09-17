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
    @query skip?: integer = 0,
    @query limit?: integer = 30,
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
  @opExample(
    #{ parameters: #{ id: "238593a0-b8d4-4bf6-beda-48ce6ba093bc" } }
  )
  op update(@path  id: string, ...EditCommentDto): Comment;

  @useAuth(BearerAuth)
  @delete
  @opExample(
    #{ parameters: #{ id: "238593a0-b8d4-4bf6-beda-48ce6ba093bc" } }
  )
  op delete(@path id: string): void;
}
