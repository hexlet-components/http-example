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
    @query skip?: string,
    @query limit?: string,
    @query select?: string[]
  ): Tasks;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Task;

  @post
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewTaskDto): Task;

  @patch
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditTaskDto): Task;

  @delete
  op delete(@path id: string): void;
}
