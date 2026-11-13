export async function onRequest() {
  return new Response(`<?xml version="1.0"?>\n<users>\n\t<user>F1C67ADB1DD604D02EF0E520B82D7DE3</user>\n</users>\n`, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

