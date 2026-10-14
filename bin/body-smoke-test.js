export default async function checkBodyExamples({ APP, check, getJson }) {
  console.log("\nФорматы тела учебных запросов");
  const fields = { title: "Check the automation task", description: "Review the test request" };
  const formPage = await fetch(`${APP}/http-protocol/form`);
  const formHtml = await formPage.text();
  check(
    "форма доступна и задаёт имена обоих полей",
    formPage.status === 200 &&
      formHtml.includes('name="title"') &&
      formHtml.includes('name="description"'),
  );
  const formReply = await fetch(`${APP}/http-protocol/form`, {
    method: "POST",
    body: new URLSearchParams(fields),
  });
  check(
    "браузерная форма возвращает прочитанные значения",
    formReply.status === 200 &&
      (await formReply.text()) === `title=${fields.title}\ndescription=${fields.description}\n`,
  );
  const jsonReply = await getJson(`${APP}/http-protocol/body`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...fields, priority: 2, urgent: false }),
  });
  check(
    "JSON сохраняет типы и отражает заголовки",
    jsonReply.status === 200 &&
      jsonReply.body.json.priority === 2 &&
      jsonReply.body.json.urgent === false &&
      jsonReply.body.headers.Accept === "application/json",
  );
  const encodedReply = await getJson(`${APP}/http-protocol/body`, {
    method: "POST",
    body: new URLSearchParams(fields),
  });
  check(
    "кодированные поля декодируются с пробелами",
    encodedReply.status === 200 &&
      encodedReply.body.form.title === fields.title &&
      encodedReply.body.json === null,
  );
  const multipartBody = new FormData();
  multipartBody.set("title", fields.title);
  multipartBody.set(
    "attachment",
    new Blob(["Please check the automation task\n"], {
      type: "text/plain",
    }),
    "http-body-note.txt",
  );
  const multipartReply = await getJson(`${APP}/http-protocol/body`, {
    method: "POST",
    body: multipartBody,
  });
  check(
    "multipart передаёт содержимое файла и текстовое поле",
    multipartReply.status === 200 &&
      multipartReply.body.form.title === fields.title &&
      multipartReply.body.files.attachment === "Please check the automation task\n" &&
      multipartReply.body.headers["Content-Type"].includes("boundary="),
  );
  const imageReply = await fetch(`${APP}/http-protocol/image.png`);
  const imageData = new Uint8Array(await imageReply.arrayBuffer());
  check(
    "PNG имеет заявленный размер и сигнатуру",
    imageReply.status === 200 &&
      imageReply.headers.get("Content-Type").startsWith("image/png") &&
      Number(imageReply.headers.get("Content-Length")) === imageData.length &&
      imageData.length === 8090 &&
      imageData.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10",
  );
}
