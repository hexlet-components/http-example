model NewPostDto {
  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model EditPostDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  body?: string;
}

model Post {
  @key
  id: uint16;

  authorId: uint16;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model Posts {
  posts: Post[];
  total: uint16;
  skip: uint16;
  limit: uint16 = 30;
}
