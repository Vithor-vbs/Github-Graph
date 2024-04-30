import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsNetworkgraph from "highcharts/modules/networkgraph";
import HCExporting from "highcharts/modules/exporting";
import HCExportData from "highcharts/modules/export-data";
import HCAccessibility from "highcharts/modules/accessibility";

import { fetchReposDetails } from "../../../githubAPI";

HighchartsNetworkgraph(Highcharts);
HCExporting(Highcharts);
HCExportData(Highcharts);
HCAccessibility(Highcharts);

const GithubRepoGraph = ({ submitData }) => {
  const [reposData, setReposData] = useState([]);
  console.log(submitData);
  const username = submitData.username;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchReposDetails(
          username,
          submitData.personalToken
        );
        const filteredData = data.filter((repo) => repo.name !== username);
        setReposData(filteredData);
        console.log(filteredData);
      } catch (error) {
        console.error("Error fetching repos data:", error);
      }
    };
    fetchData();

    // const reposData = [
    //   {
    //     name: "compusbridge",
    //     languages: ["css", "docker", "javascript"],
    //     contributors: ["angelo", "julio"],
    //   },
    //   {
    //     name: "techhub",
    //     languages: ["javascript", "python", "html", "css"],
    //     contributors: ["angelo", "nathan", "sara"],
    //   },
    //   {
    //     name: "codebase",
    //     languages: ["java", "sql", "html", "javascript"],
    //     contributors: ["michael", "chris", "lisa"],
    //   },
    //   {
    //     name: "devworld",
    //     languages: ["ruby", "python", "javascript", "html"],
    //     contributors: ["daniel", "maria", "kevin"],
    //   },
    //   {
    //     name: "datanet",
    //     languages: ["python", "java", "sql"],
    //     contributors: ["adam", "sophie", "tom"],
    //   },
    //   // Add more repositories here
    // ];
    // setReposData(reposData);
  }, [submitData]);

  useEffect(() => {
    const graphData = generateGraphData(reposData);

    const chart = Highcharts.chart("container", {
      chart: {
        type: "networkgraph",
        height: "800px",
      },
      title: {
        text: "GitHub Repository Graph",
        align: "left",
      },
      subtitle: {
        text: "A Force-Directed Network Graph in Highcharts",
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
            // enabled: true,
            // allowOverlap: true,
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
          id: "repo-graph",
          nodes: graphData.nodes,
          data: graphData.links,
        },
      ],
    });

    // Clean up
    return () => {
      chart.destroy();
    };
  }, [reposData]);

  const generateGraphData = (reposData) => {
    const nodes = {};
    const links = [];

    nodes[username] = {
      id: username,
      name: username,
      marker: {
        radius: 25,
      },
      color: "#3366cc",
      isUser: true,
    };

    reposData.forEach((repo, index) => {
      nodes[repo.name] = {
        id: repo.name,
        name: repo.name,
        marker: {
          radius: 15,
        },
        color: "#7cb5ec",
      };

      // Create link between GitHub user and repository
      links.push([username, repo.name]);

      repo.languages.forEach((language) => {
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
        // Create link between repository and language
        links.push([repo.name, language]);
      });

      repo.contributors.forEach((contributor) => {
        if (!nodes[contributor]) {
          nodes[contributor] = {
            id: contributor,
            name: contributor,
            marker: {
              radius: 12,
            },
            color: "#f7a35c",
          };
        }
        // Create link between repository and contributor
        links.push([repo.name, contributor]);
      });
    });

    return {
      nodes: Object.values(nodes),
      links: links,
    };
  };

  return <div id="container"></div>;
};

export default GithubRepoGraph;
