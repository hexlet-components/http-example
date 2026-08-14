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
  description: "Учимся проектировать и вызывать API по HTTP",
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
    #{ id: 1, title: "HTTP API", description: "Учимся проектировать и вызывать API по HTTP" },
    #{ id: 2, title: "Протокол HTTP", description: "Разбираем запрос, ответ, коды и заголовки" },
    #{ id: 3, title: "Основы JavaScript", description: "Первый язык программирования с нуля" }
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
