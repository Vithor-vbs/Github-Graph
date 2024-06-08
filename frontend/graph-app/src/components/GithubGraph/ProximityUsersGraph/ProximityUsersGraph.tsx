import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsNetworkgraph from "highcharts/modules/networkgraph";
import HCExporting from "highcharts/modules/exporting";
import HCExportData from "highcharts/modules/export-data";
import HCAccessibility from "highcharts/modules/accessibility";

import { fetchReposDetails } from "../../../../../../githubAPI";
import { fetchCachedData, postToCache } from "../utils";

import "./styles.css";
import { generateCentralityGraph } from "./CentralityGraph";

HighchartsNetworkgraph(Highcharts);
HCExporting(Highcharts);
HCExportData(Highcharts);
HCAccessibility(Highcharts);

interface RepoData {
  name: string;
  languages: string[];
  contributors: string[];
}

export interface ProximityData {
  contributor: string;
  language: string;
  userPercentage: number;
  contributorPercentage: number;
  similarityScore: number;
}

interface Props {
  reposData: RepoData[];
  targetUser: string;
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
  targetUser: string
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
          const contributorRepos = await fetchReposDetails(contributor);
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
  console.log(userLanguages, contributorLanguages);

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
        const similarityScore =
          100 - Math.abs(userPercentage - contributorPercentage);

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

  console.log(proximityData);
  return proximityData;
};

export const ProximityUsersGraph: React.FC<Props> = ({
  reposData,
  targetUser,
}) => {
  const [proximityData, setProximityData] = useState<ProximityData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { userLanguages, contributorLanguages } = await extractLanguageData(
        reposData,
        targetUser
      );
      const proximity = calculateProximity(userLanguages, contributorLanguages);
      setProximityData(proximity);
    };

    fetchData();
  }, [reposData, targetUser]);

  useEffect(() => {
    if (proximityData.length > 0) {
      generateCentralityGraph(proximityData, targetUser);
    }
  }, [proximityData, targetUser]);

  return (
    <div className="proximity-graph-container">
      {proximityData.length > 0 && (
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
          <div id="centrality-container"></div>
        </>
      )}
    </div>
  );
};
