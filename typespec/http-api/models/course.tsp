model NewCourseDto {
  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

model EditCourseDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  description?: string;
}

@example(#{
  id: 1,
  title: "HTTP API",
  description: "Designing and calling APIs over HTTP",
})
model Course {
  @key
  id: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  description: string;

}

@example(#{
  courses: #[
    #{ id: 1, title: "HTTP API", description: "Designing and calling APIs over HTTP" },
    #{ id: 2, title: "The HTTP protocol", description: "Requests, responses, status codes and headers" },
    #{ id: 3, title: "JavaScript basics", description: "A first programming language from scratch" }
  ],
  total: 3,
  skip: 0,
  limit: 30,
})
model Courses {
  courses: Course[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}
