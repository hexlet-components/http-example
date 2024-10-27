import "../../examples/users.tsp";

@example(
  newUserDtoExample,
  #{ title: "New User" }
)
model NewUserDto {
  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;

  @minLength(1)
  password: string;
}

@example(
  editUserDtoExample,
  #{ title: "Edit User" }
)
model EditUserDto {
  @minLength(1)
  email?: string;

  @minLength(1)
  firstName?: string;

  @minLength(1)
  lastName?: string;
}

@example(
  userExample,
  #{ title: "User" }
)
model User {
  @key
  id: string;

  @minLength(1)
  email: string;

  @minLength(1)
  firstName: string;

  @minLength(1)
  lastName: string;
}

@example(
  #{
    users: usersExample,
    total: totalUsersExample,
    skip: skipUsersExample,
    limit: limitUsersExample,
  },
  #{ title: "Users" }
)
model Users {
  users: User[];
  total: integer;
  skip: integer = 0;
  limit: integer = 30;
}
