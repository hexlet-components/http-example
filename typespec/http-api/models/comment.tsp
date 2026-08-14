model NewCommentDto {
  postId: uint16;

  @minLength(1)
  body: string;
}

model EditCommentDto {
  postId?: uint16;

  @minLength(1)
  body?: string;
}

// Все комментарии относятся к посту 1, по той же причине, что и посты у одного
// автора: статичный мок отдаёт один список и на /comments, и на /posts/1/comments.
@example(#{
  id: 1,
  authorId: 2,
  postId: 1,
  body: "Спасибо, наконец понял, зачем нужны заголовки",
})
model Comment {
  @key
  id: uint16;

  authorId: uint16;
  postId: uint16;

  @minLength(1)
  body: string;
}

@example(#{
  comments: #[
    #{ id: 1, authorId: 2, postId: 1, body: "Спасибо, наконец понял, зачем нужны заголовки" },
    #{ id: 2, authorId: 3, postId: 1, body: "А где почитать про кеширование подробнее?" },
    #{ id: 3, authorId: 4, postId: 1, body: "Схема запроса очень наглядная" }
  ],
  total: 3,
  skip: 0,
  limit: 30,
})
model Comments {
  comments: Comment[];
  total: uint16;
  skip: uint16 = 0;
  limit: uint16 = 30;
}
