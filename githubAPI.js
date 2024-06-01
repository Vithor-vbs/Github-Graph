import axios from "axios";
import { toast } from "react-toastify";

async function fetchRepoLanguages(username, repo, personalToken) {
  const url = `https://api.github.com/repos/${username}/${repo}/languages`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: personalToken,
      },
    });
    if (response.status === 200) {
      const languages = response.data;
      const languageNames = Object.keys(languages);
      return languageNames;
    } else {
      console.error("Error fetching repo languages:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching repo languages:", error);
    return [];
  }
}

async function fetchRepoContributors(username, repo, personalToken) {
  const url = `https://api.github.com/repos/${username}/${repo}/contributors`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: personalToken,
      },
    });
    if (response.status === 200) {
      const contributors = response.data;
      const logins = contributors.map((contributor) => contributor.login);
      return logins;
    } else {
      console.error("Error fetching repo contributors:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching repo contributors:", error);
    return [];
  }
}

export async function fetchReposDetails(username, personalToken) {
  const url = `https://api.github.com/users/${username}/repos`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: personalToken,
      },
    });
    if (response.status === 200) {
      const repos = response.data;
      const repoDetails = await Promise.all(
        repos.map(async (repo) => {
          const languages = await fetchRepoLanguages(
            username,
            repo.name,
            personalToken
          );
          const contributors = await fetchRepoContributors(
            username,
            repo.name,
            personalToken
          );
          return {
            name: repo.name,
            languages,
            contributors,
          };
        })
      );
      return repoDetails;
    } else {
      console.error("Error:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching repos details:", error);
    toast.error("Error fetching repos details. Please try again.");
    return [];
  }
}
