@example(
  #{
    postId: "some_post_id",
    body: "new comment body"
  },
  #{ title: "New comment" }
)
model NewCommentDto {
  postId: string;

  @minLength(1)
  body: string;
}

@example(
  #{
    postId: "some_post_id",
    body: "edit comment body"
  },
  #{ title: "Edit comment" }
)
model EditCommentDto {
  postId?: string;

  @minLength(1)
  body?: string;
}

@example(
  #{
    id: "some-post-id",
    authorId: "some_user_id",
    postId: "some_post_id",
    body: "comment body"
  },
  #{ title: "Comment" }
)
model Comment {
  @key
  id: string;

  authorId: string;
  postId: string;

  @minLength(1)
  body: string;
}

model Comments {
  comments: Comment[];
  total: integer;
  skip: integer;
  limit: integer = 30;
}
