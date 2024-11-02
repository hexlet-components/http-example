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

model Task {
  @key
  id: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

  status: Status;
}

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
