import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsNetworkgraph from "highcharts/modules/networkgraph";
import HCExporting from "highcharts/modules/exporting";
import HCExportData from "highcharts/modules/export-data";
import HCAccessibility from "highcharts/modules/accessibility";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchReposDetails } from "../../../../../githubAPI";
import { fetchCachedData, postToCache } from "./utils";
import { ProximityUsersGraph } from "./ProximityUsersGraph/ProximityUsersGraph";

HighchartsNetworkgraph(Highcharts);
HCExporting(Highcharts);
HCExportData(Highcharts);
HCAccessibility(Highcharts);

const GithubRepoGraph = ({ submitData, setSubmit }) => {
  const [reposData, setReposData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const cachedData = await fetchCachedData(submitData.username);
      if (cachedData) {
        setReposData(cachedData);
        console.log("Using cached data:", cachedData);
        return;
      }

      if (submitData.username !== "") {
        const data = await fetchReposDetails(
          submitData.username,
          submitData.personalToken
        );
        const filteredData = data.filter(
          (repo) => repo.name !== submitData.username
        );

        if (filteredData.length !== 0) {
          await postToCache(submitData.username, filteredData);
          console.log("Fetched and cached data:", filteredData);
        }

        setReposData(filteredData);
      }
    };
    fetchData();
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
          point: {
            events: {
              click: function () {
                // Check if the clicked node is a contributor
                if (this.color === "#f7a35c") {
                  console.log("Clicked node:", this.id);
                  setSubmit((prevState) => ({
                    ...prevState,
                    username: this.id,
                  }));
                }
              },
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

    nodes[submitData.username] = {
      id: submitData.username,
      name: submitData.username,
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
      links.push([submitData.username, repo.name]);

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

  return (
    <>
      <ToastContainer />
      <div id="container"></div>
      <ProximityUsersGraph
        reposData={reposData}
        targetUser={submitData.username}
      />
    </>
  );
};

export default GithubRepoGraph;
