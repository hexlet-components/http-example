import "@typespec/http";
import "../models/error.tsp";
import "../models/auth.tsp";

using TypeSpec.Http;

namespace AppService;

@tag("Auth")
@route("/login")
interface AuthService {
  @post
  op create(...AuthData): AuthToken;
}
