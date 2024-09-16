import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/post.tsp";
import "../models/comment.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace ForumService;

@tag("Users")
@route("/users")
interface UserService {
  @get
  op list(
    @query skip?: string,
    @query limit?: string,
    @query select?: string[]
  ): Users | Error;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): User | Error;

  @useAuth(BearerAuth)
  @post
  op create(...UserDto): User | Error;

  @useAuth(BearerAuth)
  @patch
  op update(...UserDto): User | Error;

  @useAuth(BearerAuth)
  @delete
  op delete(@path id: string): void | Error;

  @route("/{authorId}/posts")
  op getPosts(
    @path authorId: string,
    @query skip?: integer,
    @query limit?: integer = 30,
    @query select?: string
  ): Posts | Error;

  @route("/{authorId}/comments")
  op getComments(
    @path authorId: string,
    @query skip?: integer,
    @query limit?: integer = 30,
    @query select?: string
  ): Comments | Error;
}
