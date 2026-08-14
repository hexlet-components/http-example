import "@typespec/http";
import "@typespec/openapi";
import "../models/error.tsp";
import "../models/auth.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace AppService;

@tag("Auth")
@route("/login")
interface AuthService {
  @post
  @operationId("authServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...AuthData): AuthToken;
}
