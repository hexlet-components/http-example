@example(
  #{
    title: "New Task",
    description: "description"
  },
  #{ title: "New Task" }
)
model NewTaskDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

@example(
  #{
    title: "Edited Task",
    description: "new description",
  },
  #{ title: "Edit Task" }
)
model EditTaskDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;
}

@example(
  #{
    id: "some-id",
    title: "Edited Task",
    description: "new description"
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

}

model Tasks {
  tasks: Task[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}
