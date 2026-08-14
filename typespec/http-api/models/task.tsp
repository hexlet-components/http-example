model NewTaskDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  status?: Status = Status.Backlog;
}

model EditTaskDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;

  status?: Status;
}

// Набор задач продублирован в JSON-RPC эндпоинте, см. custom-server/src/data/tasks.js.
// Урок kinds курса http-api сравнивает REST и RPC на одних и тех же данных,
// поэтому расхождение здесь ломает урок. Совпадение проверяет bin/smoke-test.js.
@example(#{
  id: 1,
  title: "Publish the JavaScript basics course",
  description: "The author has prepared the course, it is ready to be published",
  status: Status.Backlog,
})
model Task {
  @key
  id: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  status: Status;
}

@example(#{
  tasks: #[
    #{
      id: 1,
      title: "Publish the JavaScript basics course",
      description: "The author has prepared the course, it is ready to be published",
      status: Status.Backlog,
    },
    #{
      id: 2,
      title: "Record a screencast about HTTP API",
      description: "Show how REST differs from RPC",
      status: Status.InProgress,
    },
    #{
      id: 3,
      title: "Update the documentation",
      description: "Describe the /rpc endpoint in the specification",
      status: Status.Done,
    }
  ],
  total: 20,
  skip: 0,
  limit: 30,
})
model Tasks {
  tasks: Task[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}

enum Status {
  Backlog: "Backlog",
  Ready: "Ready",
  InProgress: "In Progress",
  Done: "Done",
  Archived: "Archived"
}
