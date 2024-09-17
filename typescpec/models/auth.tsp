@example(#{ login: "Max", password: "password" }, #{ title: "Authentication data", description: "Login and password for authentication" })
model AuthData {
  @minLength(1)
  login: string;

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
