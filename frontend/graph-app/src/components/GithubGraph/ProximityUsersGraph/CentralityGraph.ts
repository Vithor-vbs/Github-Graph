import Highcharts from "highcharts";
import { ProximityData } from "./ProximityUsersGraph";

interface Centrality {
  [key: string]: number;
}

const interpolateColor = (value, max) => {
  const green = [144, 238, 126];
  const red = [255, 0, 0];

  const weight = value / max;
  const color = green.map((g, i) => Math.round(g + weight * (red[i] - g)));

  return `rgb(${color.join(",")})`;
};

const calculateDegreeCentrality = (graphData: {
  nodes: any[];
  links: { from: string; to: string }[];
}): Centrality => {
  const centrality: Centrality = {};

  graphData.links.forEach(({ from, to }) => {
    if (!centrality[from]) centrality[from] = 0;
    if (!centrality[to]) centrality[to] = 0;
    centrality[from]++;
    centrality[to]++;
  });

  return centrality;
};

const generateGraphData = (
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
        marker: { radius: 15 },
        color: "#f7a35c",
      };
    }

    if (!nodes[language]) {
      nodes[language] = {
        id: language,
        name: language,
        marker: { radius: 10 },
        color: "#90ee7e",
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

  const centrality: Centrality = calculateDegreeCentrality({
    nodes: Object.values(nodes),
    links,
  });

  const maxCentrality = Math.max(...Object.values(centrality));

  Object.keys(nodes).forEach((nodeId) => {
    const centralityValue = centrality[nodeId] || 0;
    nodes[nodeId].marker.radius = centralityValue ? centralityValue * 5 : 10;
    nodes[nodeId].color = interpolateColor(centralityValue, maxCentrality);
  });

  return {
    nodes: Object.values(nodes),
    links,
  };
};

export const generateCentralityGraph = (proximityData, targetUser) => {
  const graphData = generateGraphData(proximityData, targetUser);

  const chart = Highcharts.chart("centrality-container", {
    chart: {
      type: "networkgraph",
      height: "800px",
      renderTo: "centrality-container",
    },
    title: {
      text: "Language Centrality Graph",
      align: "left",
    },
    subtitle: {
      text: `Language Centrality for ${targetUser}`,
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
        id: "centrality-graph",
        nodes: graphData.nodes,
        data: graphData.links.map((link) => [link.from, link.to]),
      },
    ],
  });

  // Clean up
  return () => {
    chart.destroy();
  };
};
