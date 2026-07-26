async function test() {
  const res = await fetch('http://localhost:3000/api/admin/portfolio/manage/reels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoSrc: "test",
      description: "test",
      category: "Both",
      musicText: "test"
    })
  });
  const text = await res.text();
  console.log(res.status, text);
}
test();
