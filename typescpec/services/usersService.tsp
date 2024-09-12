import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace ForumService;

@tag("Users")
@route("/users")
interface UserService {
  @get list(@query skip?: string, @query limit?: string): Users | Error;
  @get get(@path id: string): User | Error;

  @useAuth(BearerAuth)
  @post create(...UserDto): User | Error;

  @useAuth(BearerAuth)
  @patch update(...UserDto): User | Error;

  @useAuth(BearerAuth)
  @delete delete(@path id: string): void | Error;
}
