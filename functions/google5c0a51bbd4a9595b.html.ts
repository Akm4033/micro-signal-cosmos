export async function onRequest() {
  return new Response("google-site-verification: google5c0a51bbd4a9595b.html", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
