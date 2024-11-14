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

  @useAuth(BasicAuth)
  @get
  op get(
    @path id: string,
    @query select?: string
  ): Task;

  @useAuth(BasicAuth)
  @post
  op create(...NewTaskDto): Task;

  @useAuth(BasicAuth)
  @patch
  op update(@path id: string, ...EditTaskDto): Task;

  @useAuth(BasicAuth)
  @delete
  op delete(@path id: string): void;
}
