import "../../examples/tasks.tsp";

@example(
  newTaskDtoExample,
  #{ title: "New Task" }
)
model NewTaskDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  status?: Status = Status.Backlog;
}

@example(
  editTaskDtoExample,
  #{ title: "Edit Task" }
)
model EditTaskDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;

  status?: Status;
}

@example(
  taskExample,
  #{ title: "Task" }
)
model Task {
  @key
  id: string;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  status: Status;
}

@example(
  #{
    tasks: tasksExample,
    total: totalTasksExample,
    skip: skipTasksExample,
    limit: limitTasksExample,
  },
  #{ title: "Tasks" }
)
model Tasks {
  tasks: Task[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}

enum Status {
  Backlog: "Backlog",
  Ready: "Ready",
  InProgress: "In Progress",
  Done: "Done",
  Archived: "Archived"
}
