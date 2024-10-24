import "../../examples/auth.tsp";

@example(
  authDataExample,
  #{
    title:
      "Authentication data",
      description: "Login and password for authentication"
  }
)
model AuthData {
  @minLength(1)
  email: string;

  @minLength(1)
  password: string;
}

@example(
  authTokenExample,
  #{ title: "Authorisation data", description: "Token for authorisation" }
)
model AuthToken {
  @minLength(1)
  token: string;
}
