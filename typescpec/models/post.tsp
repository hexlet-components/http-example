@example(
  #{
    authorId: "some_user_id",
    title: "new post title",
    body: "new post body"
  },
  #{ title: "New Post" }
)
model NewPostDto {
  authorId: string;

  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

@example(
  #{
    authorId: "some_user_id",
    title: "edit post title",
    body: "edit post body"
  },
  #{ title: "Edit Post" }
)
model EditPostDto {
  authorId?: string;

  @minLength(1)
  title?: string;

  @minLength(1)
  body?: string;
}

@example(
  #{
    id: "fb5e19a3-ab33-423b-9cec-8ee4ef211c61",
    authorId: "some_user_id",
    title: "post title",
    body: "post body"
  },
  #{ title: "Post" }
)
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
