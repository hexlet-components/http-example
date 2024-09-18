import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

import "./services/usersService.tsp";
import "./services/postsService.tsp";
import "./services/commentsService.tsp";
import "./services/authService.tsp";
import "./services/coursesService.tsp";

using TypeSpec.Versioning;

@service({
  title: "HTTP Api Example",
})
@versioned(Versions)
namespace AppService;

enum Versions {
  v1: "1.0",
}
