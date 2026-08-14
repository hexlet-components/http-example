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
  title: "Опубликовать курс по основам JavaScript",
  description: "Автор подготовил курс по JavaScript. Нужно его опубликовать",
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
      title: "Опубликовать курс по основам JavaScript",
      description: "Автор подготовил курс по JavaScript. Нужно его опубликовать",
      status: Status.Backlog,
    },
    #{
      id: 2,
      title: "Записать скринкаст про HTTP API",
      description: "Показать, чем REST отличается от RPC",
      status: Status.InProgress,
    },
    #{
      id: 3,
      title: "Обновить документацию",
      description: "Описать эндпоинт /rpc в спецификации",
      status: Status.Done,
    }
  ],
  total: 3,
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
