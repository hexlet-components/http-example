import "@typespec/http";
import "@typespec/rest";
import "../models/user.tsp";
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
  op get(
    @path id: string,
    @query select?: string
  ): User;

  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewUserDto): User;

  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditUserDto): User;
 
  @delete
  op delete(@path id: string): void;
}
