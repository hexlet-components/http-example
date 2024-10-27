import "../../examples/courses.tsp";

@example(
  newCourseDtoExample,
  #{ title: "New Course" }
)
model NewCourseDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

@example(
  editCourseDtoExample,
  #{ title: "Edit Course" }
)
model EditCourseDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;
}

@example(
  courseExample,
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

@example(
  #{
    courses: coursesExample,
    total: totalCoursesExample,
    skip: skipCoursesExample,
    limit: limitCoursesExample,
  },
  #{ title: "Courses" }
)
model Courses {
  courses: Course[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}
