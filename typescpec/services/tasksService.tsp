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
  @opExample(
    #{ parameters: #{ id: "some-id" } }
  )
  op get(
    @path id: string,
    @query select?: string
  ): Task;

  @post
  op create(...NewTaskDto): Task;

  @patch
  @opExample(
    #{ parameters: #{ id: "some-id" } }
  )
  op update(@path id: string, ...EditTaskDto): Task;

  @delete
  @opExample(
    #{ parameters: #{ id: "some-id" } }
  )
  op delete(@path id: string): void;
}
