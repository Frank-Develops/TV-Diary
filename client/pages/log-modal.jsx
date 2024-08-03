import React from 'react';
import ReactStars from 'react-stars';

class LogModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = { modalOpen: true, rating: null };
    this.ratingChanged = this.ratingChanged.bind(this);
    this.saveToLog = this.saveToLog.bind(this);
    this.updateLog = this.updateLog.bind(this);
  }

  render() {
    if (this.state.modalOpen === false) {
      return <div className="hidden">
      </div>;
    } else {
      return <div className="modal-container">
        <div className="delete-modal">
          <h2>How do you rate this episode?</h2>
          <div className="star-container">
            <ReactStars className="stars-mini" count={5} onChange={this.ratingChanged} size={50} color2={'#ffd700'} value={this.state.rating} />
            <ReactStars className="stars-mobile" count={5} onChange={this.ratingChanged} size={60} color2={'#ffd700'} value={this.state.rating} />
            <ReactStars className="stars-desktop" count={5} onChange={this.ratingChanged} size={100} color2={'#ffd700'} value={this.state.rating} />
          </div>
          <div className="log-modal-buttons">
            <button onClick={this.saveToLog} type="submit">Save To Log</button>
            <button onClick={this.props.toggleModal} type="button">Cancel</button>
            <button onClick={this.updateLog} type="button">Update</button>
          </div>
        </div>
      </div >;
    }
  }

  ratingChanged(newRating) {
    this.setState({ rating: newRating });
  }

  saveToLog(event) {
    const log = {
      date: new Date().toLocaleDateString(),
      showName: this.props.showName,
      season: this.props.season,
      number: this.props.number,
      episodeName: this.props.name,
      rating: this.state.rating,
      image: this.props.image
    };
    this.props.toggleModal();
    this.props.saveToLog(log);
  }

  updateLog(event) {
    console.log("update log calls");
    const update = {
      rating: this.state.rating,
      episodeToUpdate: this.props.episodeToUpdate
    };
    console.log("Update: " + update.rating + " " + update.episodeToUpdate);
    this.props.toggleModal();
    this.props.updateLog(update.episodeToUpdate, update);
  }
}

export default LogModal;
