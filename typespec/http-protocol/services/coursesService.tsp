// Эти маршруты обслуживает приложение, а не мок prism, см. custom-server/src/openapi-spec.ts.
// Спецификация описывает настоящее поведение: skip, limit и select применяются,
// вложенные ресурсы отбирают записи по родителю, а запрос несуществующей записи
// отвечает 404.
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/rest";
import "../models/course.tsp";


using TypeSpec.Http;
using TypeSpec.OpenAPI;
using TypeSpec.Rest;

namespace AppService;

@tag("Courses")
@route("/courses")
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">)
interface CourseService {
  @get
  @operationId("courseServiceList")
  op list(
    @query skip?: uint16 = 0,
    @query limit?: uint16 = 30,
    @query select?: string[]
  ): Courses;

  @get
  @operationId("courseServiceGet")
  op get(
    @path id: string,
    @query select?: string
  ): Course | NotFoundResponse;

  @post
  @operationId("courseServiceCreate")
  op create(@header contentType: "application/json" | "application/x-www-form-urlencoded", ...NewCourseDto): CreatedResponse & Course;

  @patch
  @operationId("courseServiceUpdate")
  op update(@header contentType: "application/json" | "application/x-www-form-urlencoded", @path id: string, ...EditCourseDto): Course | NotFoundResponse;

  @delete
  @operationId("courseServiceDelete")
  op delete(@path id: string): NoContentResponse | NotFoundResponse;
}
