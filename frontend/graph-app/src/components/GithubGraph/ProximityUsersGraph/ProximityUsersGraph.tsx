import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsNetworkgraph from "highcharts/modules/networkgraph";
import HCExporting from "highcharts/modules/exporting";
import HCExportData from "highcharts/modules/export-data";
import HCAccessibility from "highcharts/modules/accessibility";

import { fetchReposDetails } from "../../../../../../githubAPI";
import { fetchCachedData, postToCache } from "../utils";

import "./styles.css";

HighchartsNetworkgraph(Highcharts);
HCExporting(Highcharts);
HCExportData(Highcharts);
HCAccessibility(Highcharts);

interface RepoData {
  name: string;
  languages: string[];
  contributors: string[];
}

interface ProximityData {
  contributor: string;
  language: string;
  userPercentage: number;
  contributorPercentage: number;
  similarityScore: number;
}

interface Props {
  reposData: RepoData[];
  targetUser: string;
  personalToken: string;
}

const calculateLanguagePercentage = (
  languages: string[],
  language: string
): number => {
  const total = languages.length;
  const count = languages.filter((lang) => lang === language).length;
  return (count / total) * 100;
};

const extractLanguageData = async (
  reposData: RepoData[],
  targetUser: string,
  personalToken: string
) => {
  const userLanguages: string[] = [];
  const contributorLanguages: { [key: string]: string[] } = {};

  for (const repo of reposData) {
    userLanguages.push(...repo.languages);

    for (const contributor of repo.contributors) {
      if (contributor === targetUser) continue;

      if (!contributorLanguages[contributor]) {
        const cachedData = await fetchCachedData(contributor);
        if (cachedData) {
          contributorLanguages[contributor] = cachedData.flatMap(
            (repo: RepoData) => repo.languages
          );
        } else {
          const contributorRepos = await fetchReposDetails(
            contributor,
            personalToken
          );
          const contributorRepoLanguages = contributorRepos.flatMap(
            (repo) => repo.languages
          );
          contributorLanguages[contributor] = contributorRepoLanguages;
          await postToCache(contributor, contributorRepos);
        }
      }
    }
  }

  return { userLanguages, contributorLanguages };
};

const calculateProximity = (
  userLanguages: string[],
  contributorLanguages: { [key: string]: string[] }
): ProximityData[] => {
  const proximityData: ProximityData[] = [];
  const similarityScores: { [key: string]: number } = {};

  const uniqueUserLanguages = Array.from(new Set(userLanguages));

  Object.keys(contributorLanguages).forEach((contributor) => {
    const languages = contributorLanguages[contributor];
    const uniqueContributorLanguages = Array.from(new Set(languages));
    let totalSimilarityScore = 0;

    uniqueUserLanguages.forEach((language) => {
      if (uniqueContributorLanguages.includes(language)) {
        const userPercentage = calculateLanguagePercentage(
          userLanguages,
          language
        );
        const contributorPercentage = calculateLanguagePercentage(
          languages,
          language
        );
        const similarityScore = Math.min(userPercentage, contributorPercentage);

        totalSimilarityScore += similarityScore;

        proximityData.push({
          contributor,
          language,
          userPercentage,
          contributorPercentage,
          similarityScore,
        });
      }
    });

    similarityScores[contributor] = totalSimilarityScore;
  });

  proximityData.sort(
    (a, b) => similarityScores[b.contributor] - similarityScores[a.contributor]
  );

  return proximityData;
};

const generateGraphData = (
  proximityData: ProximityData[],
  targetUser: string
) => {
  const nodes = {};
  const links: { from: string; to: string; value: number; color?: string }[] =
    [];

  // Add the targetUser as a central node
  nodes[targetUser] = {
    id: targetUser,
    name: targetUser,
    marker: {
      radius: 25,
    },
    color: "#3366cc",
  };

  proximityData.forEach(({ contributor, language, similarityScore }) => {
    if (!nodes[contributor]) {
      nodes[contributor] = {
        id: contributor,
        name: contributor,
        marker: {
          radius: 15,
        },
        color: "#f7a35c",
      };
    }

    if (!nodes[language]) {
      nodes[language] = {
        id: language,
        name: language,
        marker: {
          radius: 10,
        },
        color: "#90ee7e",
      };
    }

    links.push({
      from: contributor,
      to: language,
      value: similarityScore,
    });

    // Create links between targetUser and contributors
    links.push({
      from: targetUser,
      to: contributor,
      value: 1,
      color: "#3366cc",
    });
  });

  return {
    nodes: Object.values(nodes),
    links,
  };
};

export const ProximityUsersGraph: React.FC<Props> = ({
  reposData,
  targetUser,
  personalToken,
}) => {
  const [proximityData, setProximityData] = useState<ProximityData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { userLanguages, contributorLanguages } = await extractLanguageData(
        reposData,
        targetUser,
        personalToken
      );
      const proximity = calculateProximity(userLanguages, contributorLanguages);
      setProximityData(proximity);
    };

    fetchData();
  }, [reposData, targetUser, personalToken]);

  useEffect(() => {
    if (proximityData.length > 0) {
      const graphData = generateGraphData(proximityData, targetUser);

      const chart = Highcharts.chart("proximity-container", {
        chart: {
          type: "networkgraph",
          height: "800px",
        },
        title: {
          text: "Language Proximity Graph",
          align: "left",
        },
        subtitle: {
          text: `Language Proximity for ${targetUser}`,
          align: "left",
        },
        plotOptions: {
          networkgraph: {
            keys: ["from", "to"],
            layoutAlgorithm: {
              enableSimulation: true,
              friction: -0.9,
              repulsion: 1500,
            },
            dataLabels: {
              enabled: true,
              allowOverlap: true,
              color: "black",
              style: {
                fontSize: "14px",
                textOutline: "none",
              },
            },
          },
        },
        series: [
          {
            accessibility: {
              enabled: false,
            },
            id: "proximity-graph",
            nodes: graphData.nodes,
            data: graphData.links.map((link) => [link.from, link.to]),
          },
        ],
      });

      // Clean up
      return () => {
        chart.destroy();
      };
    }
  }, [proximityData, targetUser]);

  return (
    <div className="proximity-graph-container">
      <h3>Language Proximity for {targetUser}</h3>
      <table className="proximity-table">
        <thead>
          <tr>
            <th>Contributor</th>
            <th>Language</th>
            <th>{targetUser} Percentage</th>
            <th>Contributor Percentage</th>
            <th>Similarity Score</th>
          </tr>
        </thead>
        <tbody>
          {proximityData.map(
            ({
              contributor,
              language,
              userPercentage,
              contributorPercentage,
              similarityScore,
            }) => (
              <tr key={`${contributor}-${language}`}>
                <td>{contributor}</td>
                <td>{language}</td>
                <td>{userPercentage.toFixed(2)}%</td>
                <td>{contributorPercentage.toFixed(2)}%</td>
                <td>{similarityScore.toFixed(2)}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
      <div id="proximity-container"></div>
    </div>
  );
};
