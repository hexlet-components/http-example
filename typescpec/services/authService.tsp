import "@typespec/http";
import "../models/error.tsp";
import "../models/auth.tsp";

using TypeSpec.Http;

namespace ForumService;

@tag("Auth")
@route("/login")
interface AuthService {
  @post create(...AuthLogin): AuthToken;
}
