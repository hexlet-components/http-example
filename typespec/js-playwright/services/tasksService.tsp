// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/task.tsp";


using TypeSpec.Http;
using TypeSpec.OpenAPI;
using TypeSpec.Rest;

namespace AppService;

@tag("Tasks")
@route("/tasks")
interface TaskService {
  @get
  @operationId("taskServiceList")
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string[]
  ): Tasks;

  @get
  @operationId("taskServiceGet")
  op get(
    @path id: string,
    @query select?: string
  ): Task | NotFoundResponse;

  @post
  @operationId("taskServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewTaskDto): CreatedResponse & Task;

  @patch
  @operationId("taskServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditTaskDto): Task | NotFoundResponse;

  @delete
  @operationId("taskServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
