import multipart from "@fastify/multipart";

// Изолированный учебный обработчик отражает данные без изменения коллекций.
export default async function setUpBodyExamples(app) {
  await app.register(multipart, {
    limits: { files: 1, fields: 10, parts: 11, fileSize: 65536, fieldSize: 4096 },
  });

  app.get("/http-protocol/form", (_req, res) => res.sendFile("http-protocol/form.html"));
  app.post("/http-protocol/form", (req, res) => {
    const { title = "", description = "" } = req.body ?? {};
    return res
      .type("text/plain; charset=utf-8")
      .send(`title=${title}\ndescription=${description}\n`);
  });

  app.get("/http-protocol/image.png", (_req, res) => res.sendFile("http-protocol/image.png"));

  app.post("/http-protocol/body", async (req) => {
    const headers = { "Content-Type": req.headers["content-type"] };
    if (req.headers.accept) headers.Accept = req.headers.accept;
    const result = { headers, json: null, form: Object.create(null), files: Object.create(null) };
    if (req.isMultipart()) {
      for await (const part of req.parts()) {
        if (part.type === "file") {
          const data = await part.toBuffer();
          result.files[part.fieldname] = data.toString("utf8");
        } else {
          result.form[part.fieldname] = part.value;
        }
      }
    } else if (req.headers["content-type"]?.startsWith("application/json")) {
      result.json = req.body;
    } else {
      result.form = req.body ?? {};
    }
    return result;
  });
}
