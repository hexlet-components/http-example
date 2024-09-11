model AuthRequest {
  @minLength(1)
  login: string;

  @minLength(1)
  password: string;
}

model AuthResponse {
  @minLength(1)
  token: string;
}
