# GitHub User Graph Visualization

This application provides a graphical representation of a GitHub user's network, including their repositories, contributors, and languages. By entering a GitHub username, the application fetches information using the GitHub API, processes the data, and displays it in various interactive visualizations.

![image](https://github.com/Vithor-vbs/Github-Graph/assets/69211568/bd1e4d4a-5cff-4537-a226-0f93eaef5eb7)


## Features

- **Proximity Table**: Shows the proximity of the target user to certain languages and contributors, along with a similarity calculation.

  ![image](https://github.com/Vithor-vbs/Github-Graph/assets/69211568/0ad822a1-ff4b-4c26-927a-3d09d4120f12)



- **Centrality Graph**: Visualizes the centrality of each node based on its degree. Centrality measures help identify the most important nodes in a graph.

  ![image](https://github.com/Vithor-vbs/Github-Graph/assets/69211568/3f33dc8b-d322-4906-899e-a25fcdb798cd)

  
- **Community Detection Graph**: Split the graph into clusters or communities. This is helpful to identify groups of contributors who have similar language profiles.

  ![image](https://github.com/Vithor-vbs/Github-Graph/assets/69211568/b679aa73-9d43-4f1f-b5aa-4fd56a106b45)



## API Caching

To avoid hitting the GitHub API rate limits, a caching system is implemented using MongoDB. This stores previously fetched data about users to reduce the number of API requests.

## Technology Stack

- **Frontend**: React and Highcharts lib for graph visualizations.
- **Backend**: Node.js with Express.js to handle API requests.
- **Database**: MongoDB for caching data and reducing API request overhead.
- **Containerization**: Docker for easy deployment with a MongoDB image.

## Graph Algorithms

- **Centrality Graph**: Uses the degree centrality algorithm to determine the centrality of each node.
- **Community Detection Graph**: Groups users into communities based on common languages.

## Getting Started

### Prerequisites

- Node.js
- Docker

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Vithor-vbs/Github-Graph
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the application:

   ```bash
   npm start
   ```
