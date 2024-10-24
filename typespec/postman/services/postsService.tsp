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
    @query skip?: integer = 0,
    @query limit?: integer = 30,
    @query select?: string
  ): Posts;

  @get
  @opExample(
    #{ parameters: #{ id: "fb5e19a3-ab33-423b-9cec-8ee4ef211c61" } }
  )
  op get(
    @path id: string,
    @query select?: string
  ): Post;

  @useAuth([BearerAuth, BasicAuth])
  @post
  op create(...NewPostDto): Post;

  @useAuth([BearerAuth, BasicAuth])
  @patch
  @opExample(
    #{ parameters: #{ id: "fb5e19a3-ab33-423b-9cec-8ee4ef211c61" } }
  )
  op update(@path id: string, ...EditPostDto): Post;

  @useAuth([BearerAuth, BasicAuth])
  @delete
  @opExample(
    #{ parameters: #{ id: "fb5e19a3-ab33-423b-9cec-8ee4ef211c61" } }
  )
  op delete(@path id: string): void;

  @route("/{postId}/comments")
  op getComments(
    @path postId: string,
    @query skip?: integer = 0,
    @query limit?: integer = 30,
    @query select?: string
  ): Comments;
}
