@example(
  #{
    title: "New Task",
    description: "description",
    status: Status.Ready,
  },
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
  #{
    title: "Edited Task",
    description: "new description",
    status: Status.Ready,
  },
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
  #{
    id: "some-id",
    title: "Edited Task",
    description: "new description",
    status: Status.Ready,
  },
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
