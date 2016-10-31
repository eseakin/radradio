import styles from 'style';
import React from 'react';

class HomeListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      done: false
    }
  };

  render() {

    var style = {
      cursor: 'pointer',
      color: this.state.done ? '#b3e7ff' : '#e7ddc9',
    }

    return(
      <tr style={style} onMouseEnter={this.toggle.bind(this)} onMouseLeave={this.toggle.bind(this)} onClick={()=>{this.props.handleClick(this.props.item)}}>
				<td> <strong>{this.props.item.username}</strong> </td>
				<td> {this.props.item.title} </td>
				<td> {this.props.item.description} </td>
			</tr>
    )

  }

  toggle() {
    this.setState({
      done: !this.state.done
    })
  };
};

export default HomeListItem;