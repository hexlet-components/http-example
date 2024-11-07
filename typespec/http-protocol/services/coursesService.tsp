import "@typespec/http";
import "@typespec/rest";
import "../models/course.tsp";


using TypeSpec.Http;
using TypeSpec.Rest;

namespace AppService;

@tag("Courses")
@route("/courses")
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">)
interface CourseService {
  @get
  op list(
    @query skip?: string,
    @query limit?: string,
    @query select?: string[]
  ): Courses;

  @get
  op get(
    @path id: string,
    @query select?: string
  ): Course;

  @post
  op create(...NewCourseDto): Course;

  @patch
  op update(@path id: string, ...EditCourseDto): Course;

  @delete
  op delete(@path id: string): void;
}
