model Post {
  @key
  id: string;

  userId: string;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

model Posts {
  posts: Post[];
  total: integer;
  skip: integer;
  limit: integer;
}
