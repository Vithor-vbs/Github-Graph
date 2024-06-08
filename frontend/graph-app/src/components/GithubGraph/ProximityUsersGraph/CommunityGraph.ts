import Highcharts from "highcharts";
import { ProximityData } from "./ProximityUsersGraph";

const interpolateColor = (index: number, total: number): string => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 100%, 50%)`;
};

const findLanguageCommunities = (graphData: {
  nodes: any[];
  links: { from: string; to: string }[];
}): { [language: string]: string[] } => {
  const communities: { [language: string]: string[] } = {};

  graphData.nodes.forEach((node) => {
    if (node.type === "language") {
      communities[node.id] = [];
    }
  });

  graphData.links.forEach(({ from, to }) => {
    if (graphData.nodes.find((node) => node.id === from)?.type === "language") {
      communities[from].push(to);
    }
    if (graphData.nodes.find((node) => node.id === to)?.type === "language") {
      communities[to].push(from);
    }
  });

  return communities;
};

const generateCommunityGraphData = (
  proximityData: ProximityData[],
  targetUser: string
) => {
  const nodes: { [key: string]: any } = {};
  const links: { from: string; to: string; value: number; color?: string }[] =
    [];

  proximityData.forEach(({ contributor, language, similarityScore }) => {
    if (!nodes[contributor]) {
      nodes[contributor] = {
        id: contributor,
        name: contributor,
        type: "contributor",
      };
    }

    if (!nodes[language]) {
      nodes[language] = {
        id: language,
        name: language,
        type: "language",
      };
    }

    links.push({ from: contributor, to: language, value: similarityScore });

    links.push({
      from: targetUser,
      to: contributor,
      value: 1,
      color: "#3366cc",
    });
  });

  const graphData = { nodes: Object.values(nodes), links };
  const communities = findLanguageCommunities(graphData);
  const communitySeries = Object.keys(communities).map((language, index) => {
    const communityLinks = links.filter(
      (link) => link.from === language || link.to === language
    );
    return {
      name: language,
      color: interpolateColor(index, Object.keys(communities).length),
      marker: {
        radius: 10,
        symbol: "circle",
        fillColor: interpolateColor(index, Object.keys(communities).length),
        lineWidth: 2,
        lineColor: "white",
      },
      data: communityLinks.map((link) => ({
        from: link.from,
        to: link.to,
        color: interpolateColor(index, Object.keys(communities).length),
      })),
    };
  });

  return communitySeries;
};

export const generateCommunityGraph = (
  proximityData: ProximityData[],
  targetUser: string
) => {
  const communitySeries = generateCommunityGraphData(proximityData, targetUser);

  const chart = Highcharts.chart("community-container", {
    chart: {
      type: "networkgraph",
      height: "800px",
      renderTo: "community-container",
    },
    title: {
      text: "Language Community Graph",
      align: "left",
    },
    subtitle: {
      text: `Language Communities for ${targetUser}`,
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
    series: communitySeries,
  });

  // Clean up
  return () => {
    chart.destroy();
  };
};
