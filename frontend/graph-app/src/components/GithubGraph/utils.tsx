export async function fetchCachedData(username) {
  const response = await fetch(`http://localhost:5000/cache/${username}`);
  if (!response.ok) {
    console.error(`HTTP error:  ${response.status}`);
  }
  const data = await response.json();
  return data;
}

export async function postToCache(username, filteredData) {
  const response = await fetch("http://localhost:5000/cache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      filteredData,
    }),
  });

  if (!response.ok) {
    console.error(`HTTP error:  ${response.status}`);
  }
}
