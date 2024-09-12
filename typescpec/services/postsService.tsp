import "@typespec/http";
import "@typespec/rest";
import "../models/post.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace ForumService;

@tag("Posts")
@route("/posts")
interface PostService {
  @get list(@query skip?: string, @query limit?: string): Posts | Error;
  @get get(@path id: string): Post | Error;

  @useAuth(BearerAuth)
  @post create(...PostDto): Post | Error;

  @useAuth(BearerAuth)
  @patch update(...PostDto): Post | Error;

  @useAuth(BearerAuth)
  @delete delete(@path id: string): void | Error;
}
