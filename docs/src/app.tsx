import React from 'react';
import './App.css';
import 'perspective-viewer';
import '@jpmorganchase/perspective-viewer';
import '@jpmorganchase/perspective-viewer/dist/umd/material-design';

interface IProps {}

interface IState {
  data: any[];
  showGraph: boolean;
}

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      data: [],
      showGraph: false,
    };
  }

  componentDidMount() {
    this.getDataFromServer();
  }

  getDataFromServer = () => {
    fetch('http://localhost:8080/query')
      .then((response) => response.json())
      .then((data) => {
        this.setState({ data });
      });

    // Fetch data continuously every 5 seconds
    setInterval(this.getDataFromServer, 5000);
  };

  renderGraph = () => {
    this.setState({ showGraph: true });
  };

  render() {
    const { data, showGraph } = this.state;
    return (
      <div className="App">
        <button onClick={this.renderGraph}>Start Streaming Data</button>
        {showGraph && (
          <perspective-viewer
          view="y_line"
          row-pivots='["timestamp"]'
          column-pivots='["stock"]'
          columns='["top_ask_price"]'
          aggregates='{"top_ask_price":"avg"}'
          data={data}
        />
        
        )}
      </div>
    );
  }
}

export default App;
