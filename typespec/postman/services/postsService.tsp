import "@typespec/http";
import "@typespec/rest";
import "../models/post.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Posts")
@route("/posts")
interface PostService {
  @get
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Posts;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Post;

  @useAuth(BearerAuth)
  @post
  op create(...NewPostDto): Post;

  @useAuth(BearerAuth)
  @patch
  op update(@path id: string, ...EditPostDto): Post;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void;

  @route("/{postId}/comments")
  op getComments(
    @path postId: string,
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string
  ): Comments;
}
