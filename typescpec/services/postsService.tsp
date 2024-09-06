import "@typespec/http";
import "@typespec/rest";
import "../models/post.tsp";
import "../models/error.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@tag("Posts")
@route("/posts")
interface PostService extends Resource.ResourceOperations<Post, Error> {
}
