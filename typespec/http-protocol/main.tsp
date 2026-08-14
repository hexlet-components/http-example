import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

// authService здесь не подключён намеренно. По адресу /http-protocol/login
// живёт рукописный эндпоинт: курс про протокол разбирает отправку формы через
// telnet и печатает в уроке ответ `Done!` с Content-Length: 5. Спецификация же
// описывала выдачу токена, то есть то, чего этот адрес никогда не отдавал.
import "./services/usersService.tsp";
import "./services/postsService.tsp";
import "./services/commentsService.tsp";
import "./services/coursesService.tsp";
import "./services/tasksService.tsp";

using TypeSpec.Versioning;
using TypeSpec.Http;

@service(#{
  title: "HTTP Api Example",
})
@versioned(Versions)
@server("/http-protocol", "Server endpoint")
namespace AppService;

enum Versions {
  v1: "1.0",
}
