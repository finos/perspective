import React from 'react';

interface IProps {
  elem: any; // Type this according to your project
}

class Graph extends React.Component<IProps> {
  componentDidMount() {
    const { elem } = this.props;
    if (elem) {
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('column-pivots', '["stock"]');
      elem.setAttribute('columns', '["top_ask_price"]');
      elem.setAttribute('aggregates', '{"top_ask_price":"avg"}');
    }
  }

  render() {
    return <div>Graph Component</div>;
  }
}

export default Graph;
