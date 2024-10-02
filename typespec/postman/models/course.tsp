@example(
  #{
    title: "New course",
    description: "description"
  },
  #{ title: "New Course" }
)
model NewCourseDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

@example(
  #{
    title: "Edited course",
    description: "new description",
  },
  #{ title: "Edit Course" }
)
model EditCourseDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;
}

@example(
  #{
    id: "some-id",
    title: "Edited course",
    description: "new description"
  },
  #{ title: "Course" }
)
model Course {
  @key
  id: string;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

model Courses {
  courses: Course[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}
