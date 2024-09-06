import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

@tag("Users")
@route("/users")
interface UserService extends Resource.ResourceOperations<User, Error> {
}
