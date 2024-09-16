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
  @get
  op list(
    @query skip?: integer,
    @query limit?: integer = 30,
    @query select?: string
  ): Posts | Error;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Post | Error;

  @useAuth(BearerAuth)
  @post
  op create(...PostDto): Post | Error;

  @useAuth(BearerAuth)
  @patch
  op update(...PostDto): Post | Error;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void | Error;

  @route("/{postId}/comments")
  op getComments(
    @path postId: string,
    @query skip?: integer,
    @query limit?: integer = 30,
    @query select?: string
  ): Comments | Error;
}
