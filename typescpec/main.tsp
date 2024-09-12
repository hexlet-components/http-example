import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

import "./services/usersService.tsp";
import "./services/postsService.tsp";
import "./services/commentsService.tsp";
import "./services/authService.tsp";

using TypeSpec.Versioning;

@service({
  title: "Forum HTTP Api Example",
})
@versioned(Versions)
namespace ForumService;

enum Versions {
  v1: "1.0",
}
