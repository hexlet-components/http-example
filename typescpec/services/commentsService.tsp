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
  @get list(@query skip?: string, @query limit?: string): Comments | Error;
  @get get(@path id: string): Comment | Error;

  @useAuth(BearerAuth)
  @post create(...Comment): Comment | Error;

  @useAuth(BearerAuth)
  @patch update(...Comment): Comment | Error;

  @useAuth(BearerAuth)
  @delete delete(@path id: string): void | Error;
}
