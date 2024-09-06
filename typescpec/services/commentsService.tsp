import "@typespec/http";
import "@typespec/rest";
import "../models/comment.tsp";
import "../models/error.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

@tag("Comments")
@route("/comments")
interface CommentService extends Resource.ResourceOperations<Comment, Error> {
}
