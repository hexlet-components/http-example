const totalTasksExample = 5;

const skipTasksExample = 0;

const limitTasksExample = 30;

const newTaskDtoExample = #{
  title: "New Task",
  description: "description",
  status: Status.Ready,
};

const editTaskDtoExample = #{
  title: "Edited Task",
  description: "new description",
  status: Status.Ready,
};

const taskExample = #{
  id: "1",
  title: "Опубликовать курс по основам JavaScript",
  description: "Автор подготовил курс по JavaScript. Нужно его опубликовать",
  status: Status.Backlog,
};

const tasksExample = #[
  taskExample,
  #{
    id: "2",
    title: "Опубликовать курс по основам Ruby",
    description: "Автор подготовил курс по Ruby. Нужно его опубликовать",
    status: Status.Ready
  },
  #{
    id: "3",
    title: "Опубликовать курс по основам PHP",
    description: "Автор подготовил курс по PHP. Нужно его опубликовать",
    status: Status.InProgress
  },
  #{
    id: "4",
    title: "Опубликовать курс по основам Java",
    description: "Автор подготовил курс по Java. Нужно его опубликовать",
    status: Status.Done
  },
  #{
    id: "5",
    title: "Опубликовать курс по основам Python",
    description: "Автор подготовил курс по Python. Нужно его опубликовать",
    status: Status.Archived
  }
];
