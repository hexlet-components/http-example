import "@typespec/http";
import "../models/error.tsp";
import "../models/auth.tsp";

using TypeSpec.Http;

@tag("Auth")
@route("/login")
interface AuthService {
  @post create(...AuthRequest): AuthResponse;
}
