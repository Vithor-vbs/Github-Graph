import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsNetworkgraph from "highcharts/modules/networkgraph";
import HCExporting from "highcharts/modules/exporting";
import HCExportData from "highcharts/modules/export-data";
import HCAccessibility from "highcharts/modules/accessibility";

import { fetchCachedData, postToCache } from "../utils";
import { fetchReposDetails } from "../../../../../../githubAPI";
import "./styles.css";

HighchartsNetworkgraph(Highcharts);
HCExporting(Highcharts);
HCExportData(Highcharts);
HCAccessibility(Highcharts);

interface ProximityData {
  contributor: string;
  language: string;
  userPercentage: number;
  contributorPercentage: number;
  similarityScore: number;
}

interface ProximityUsersGraphProps {
  reposData: any[];
  targetUser: string;
  personalToken: string;
}

export const ProximityUsersGraph: React.FC<ProximityUsersGraphProps> = ({
  reposData,
  targetUser,
  personalToken,
}) => {
  const [proximityData, setProximityData] = useState<ProximityData[]>([]);

  useEffect(() => {
    const fetchContributorData = async (contributor: string) => {
      const cachedData = await fetchCachedData(contributor);
      if (cachedData) {
        return cachedData;
      } else {
        const data = await fetchReposDetails(contributor, personalToken);
        if (data) {
          await postToCache(contributor, data);
        }
        return data;
      }
    };

    const calculateProximityData = async () => {
      const userLanguages = new Map<string, number>();

      reposData.forEach((repo) => {
        repo.languages.forEach((language: string) => {
          userLanguages.set(language, (userLanguages.get(language) || 0) + 1);
        });
      });

      const totalUserLanguages = Array.from(userLanguages.values()).reduce(
        (acc, value) => acc + value,
        0
      );

      const userLanguagePercentage = new Map<string, number>();

      userLanguages.forEach((value, key) => {
        userLanguagePercentage.set(key, (value / totalUserLanguages) * 100);
      });

      const proximityData: ProximityData[] = [];

      for (const repo of reposData) {
        for (const contributor of repo.contributors) {
          if (contributor === targetUser) continue;

          const contributorData = await fetchContributorData(contributor);
          const contributorLanguages = new Map<string, number>();

          contributorData.forEach((repo: any) =>
            repo.languages.forEach((lang: string) => {
              contributorLanguages.set(
                lang,
                (contributorLanguages.get(lang) || 0) + 1
              );
            })
          );

          const totalContributorLanguages = Array.from(
            contributorLanguages.values()
          ).reduce((acc, value) => acc + value, 0);

          const contributorLanguagePercentage = new Map<string, number>();

          contributorLanguages.forEach((value, key) => {
            contributorLanguagePercentage.set(
              key,
              (value / totalContributorLanguages) * 100
            );
          });

          repo.languages.forEach((language: string) => {
            if (contributorLanguages.has(language)) {
              const userPercentage = userLanguagePercentage.get(language) || 0;
              const contributorPercentage =
                contributorLanguagePercentage.get(language) || 0;

              const similarityScore =
                (userPercentage + contributorPercentage) / 2;

              proximityData.push({
                contributor,
                language,
                userPercentage,
                contributorPercentage,
                similarityScore,
              });
            }
          });
        }
      }

      setProximityData(proximityData);
    };

    calculateProximityData();
  }, [reposData, targetUser, personalToken]);

  useEffect(() => {
    if (proximityData.length > 0) {
      const graphData = generateGraphData(proximityData, targetUser);
      Highcharts.chart({
        chart: {
          type: "networkgraph",
          height: "800px",
          renderTo: "proximity-container",
        },
        title: {
          text: "Proximity Graph",
          align: "left",
        },
        plotOptions: {
          networkgraph: {
            keys: ["from", "to"],
            layoutAlgorithm: {
              enableSimulation: true,
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
            point: {
              events: {
                click: function () {},
              },
            },
          },
        },
        series: [
          {
            type: "networkgraph",
            accessibility: {
              enabled: false,
            },
            id: "proximity-graph",
            nodes: graphData.nodes,
            data: graphData.links,
          },
        ],
      });
    }
  }, [proximityData, targetUser]);

  const createGraph = (proximityData: ProximityData[], targetUser: string) => {
    const graph: { [key: string]: string[] } = {};

    graph[targetUser] = [];

    proximityData.forEach((data) => {
      const { contributor, language } = data;

      if (!graph[targetUser].includes(contributor)) {
        graph[targetUser].push(contributor);
      }

      if (!graph[contributor]) {
        graph[contributor] = [];
      }

      if (!graph[contributor].includes(language)) {
        graph[contributor].push(language);
      }
    });

    return graph;
  };

  const bfsProximity = (
    graph: { [key: string]: string[] },
    startNode: string
  ) => {
    const visited = new Set<string>();
    const queue: [string, number][] = [[startNode, 0]];
    const proximityScores = new Map<string, number>();

    while (queue.length > 0) {
      const [node, level] = queue.shift()!;

      if (!visited.has(node)) {
        visited.add(node);

        if (node !== startNode) {
          proximityScores.set(node, level);
        }

        (graph[node] || []).forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            queue.push([neighbor, level + 1]);
          }
        });
      }
    }

    return proximityScores;
  };

  const generateGraphData = (
    proximityData: ProximityData[],
    targetUser: string
  ) => {
    const graph = createGraph(proximityData, targetUser);
    const proximityScores = bfsProximity(graph, targetUser);

    const nodes: Highcharts.SeriesNetworkgraphNodesOptions[] = [
      {
        id: targetUser,
        marker: { radius: 25 },
        color: "#3366cc",
      },
    ];
    const links: { from: string; to: string; value: number }[] = [];

    proximityData.forEach((data) => {
      const { contributor, language } = data;

      if (!nodes.find((node) => node.id === contributor)) {
        nodes.push({
          id: contributor,
          marker: { radius: 15 },
          color: "#7cb5ec",
        });
      }

      if (!nodes.find((node) => node.id === language)) {
        nodes.push({
          id: language,
          marker: { radius: 10 },
          color: "#90ee7e",
        });
      }

      links.push({
        from: targetUser,
        to: contributor,
        value: proximityScores.get(contributor) || 1,
      });
      links.push({
        from: contributor,
        to: language,
        value: 1,
      });
    });

    return { nodes, links };
  };

  return (
    <div className="proximity-graph-container">
      {proximityData && proximityData.length > 0 && (
        <>
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
                (
                  {
                    contributor = "",
                    language = "",
                    userPercentage = 0,
                    contributorPercentage = 0,
                    similarityScore = 0,
                  }: ProximityData,
                  index: number
                ) => (
                  <tr key={`${contributor}-${language}-${index}`}>
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
        </>
      )}
    </div>
  );
};
