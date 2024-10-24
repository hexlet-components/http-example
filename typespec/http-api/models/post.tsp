import "../../examples/posts.tsp";

@example(
  newPostDtoExample,
  #{ title: "New Post" }
)
model NewPostDto {
  @minLength(1)
  title: string;

  @minLength(1)
  body: string;
}

@example(
  editPostDtoExample,
  #{ title: "Edit Post" }
)
model EditPostDto {
  @minLength(1)
  title?: string;

  @minLength(1)
  body?: string;
}

@example(
  postExample,
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

@example(
  #{
    posts: postsExample,
    total: totalPostsExample,
    skip: skipPostsExample,
    limit: limitPostsExample,
  },
  #{ title: "posts" }
)
model Posts {
  posts: Post[];
  total: integer;
  skip: integer;
  limit: integer = 30;
}
