// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/resources.js.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// а запрос несуществующей записи отвечает 404.
import "@typespec/http";
import "@typespec/rest";
import "../models/task.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Tasks")
@route("/tasks")
interface TaskService {
  @get
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string[]
  ): Tasks;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Task | NotFoundResponse;

  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewTaskDto): CreatedResponse & Task;

  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditTaskDto): Task | NotFoundResponse;

  @delete
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
