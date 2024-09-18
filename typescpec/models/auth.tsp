@example(#{ email: "max@hotmail.com", password: "password" }, #{ title: "Authentication data", description: "Login and password for authentication" })
model AuthData {
  @minLength(1)
  email: string;

  @minLength(1)
  password: string;
}

@example(
  #{
    token: "secret_token"
  },
  #{ title: "Authorisation data", description: "Token for authorisation" }
)
model AuthToken {
  @minLength(1)
  token: string;
}
