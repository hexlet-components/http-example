import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/post.tsp";
import "../models/comment.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Users")
@route("/users")
interface UserService {
  @get
  op list(
    @query skip?: string,
    @query limit?: string,
    @query select?: string[]
  ): Users;

  @get
  @opExample(
    #{ parameters: #{ id: "a788f3fc-0d47-4d55-b18b-09bae52dac7b" } }
  )
  op get(
    @path id: string,
    @query select?: string
  ): User;

  @post
  op create(...NewUserDto): User;

  @useAuth(BearerAuth)
  @patch
  @opExample(
    #{ parameters: #{ id: "a788f3fc-0d47-4d55-b18b-09bae52dac7b" } }
  )
  op update(@path id: string, ...EditUserDto): User;

  @useAuth(BearerAuth)
  @delete
  @opExample(
    #{ parameters: #{ id: "a788f3fc-0d47-4d55-b18b-09bae52dac7b" } }
  )
  op delete(@path id: string): void;

  @route("/{authorId}/posts")
  op getPosts(
    @path authorId: string,
    @query skip?: integer = 0,
    @query limit?: integer = 30,
    @query select?: string
  ): Posts;

  @route("/{authorId}/comments")
  op getComments(
    @path authorId: string,
    @query skip?: integer = 0,
    @query limit?: integer = 30,
    @query select?: string
  ): Comments;
}
