model NewPostDto {
  authorId: string;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model EditPostDto {
  authorId: string;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model Post {
  @key
  id: string;

  authorId: string;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model Posts {
  posts: Post[];
  total: integer;
  skip: integer;
  limit: integer = 30;
}
