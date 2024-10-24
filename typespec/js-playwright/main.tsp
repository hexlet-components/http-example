import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

import "./services/usersService.tsp";
import "./services/authService.tsp";
import "./services/coursesService.tsp";
import "./services/tasksService.tsp";

using TypeSpec.Versioning;
using TypeSpec.Http;

@service({
  title: "HTTP Api Example",
})
@versioned(Versions)
@server("/js-playwright", "Server endpoint")
namespace AppService;

enum Versions {
  v1: "1.0",
}
